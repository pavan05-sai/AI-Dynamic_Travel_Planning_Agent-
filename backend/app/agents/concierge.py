import json
from typing import Any, Dict, List, Tuple
from app.agents.base import BaseAgent
from app.core.logging import get_logger
from app.schemas.chat import ConciergeReply
from app.schemas.itinerary import CanonicalItinerary
from app.tools.registry import ToolRegistry

logger = get_logger("concierge_agent")


class ConciergeAgent(BaseAgent):
    def __init__(self):
        super().__init__(name="Concierge", prompt_file="concierge.txt")

    def chat(
        self,
        message: str,
        itinerary: CanonicalItinerary,
        chat_history: List[Dict[str, str]],
        tool_registry: ToolRegistry
    ) -> Tuple[ConciergeReply, List[str]]:
        tools = tool_registry.get_tool_for_agent("concierge")
        trace: List[str] = [f"Concierge processing user message: '{message}'"]

        days_summary = []
        for day in itinerary.days:
            days_summary.append({
                "day": day.day_number,
                "date": day.date,
                "theme": day.theme,
                "items": [{"id": it.id, "name": it.name, "start": it.start_time, "end": it.end_time, "cost": it.cost.amount, "reason": it.reason} for it in day.items]
            })

        prompt = f"""
Trip: {itinerary.trip.title} in {itinerary.trip.destination.name}
Budget: Limit ₹{itinerary.budget.total_limit:,}, Estimated ₹{itinerary.budget.estimated_total:,}, Status: {itinerary.budget.status}

Itinerary Overview:
{json.dumps(days_summary, indent=2)}

Recent Conversation History:
{json.dumps(chat_history[-6:], indent=2)}

User Message: "{message}"

Classify user intent (answer, modify, regenerate, clarify) and produce JSON response.
"""

        result_json, agent_trace = self.run_tool_loop(prompt, tools)
        trace.extend(agent_trace)

        try:
            reply = ConciergeReply(**result_json)
            trace.append(f"Classified intent: '{reply.intent}'")
            return reply, trace
        except Exception as e:
            logger.warning(f"Error parsing concierge response: {e}. Fallback used.")
            # Deterministic fallback based on keywords
            msg_lower = message.lower()
            if any(k in msg_lower for k in ["cheaper", "remove", "add", "change", "replace", "swap", "move", "budget"]):
                return ConciergeReply(
                    text="I've understood your modification request and will adjust the itinerary accordingly.",
                    intent="modify",
                    instruction=message
                ), trace
            return ConciergeReply(
                text="I'm here to assist with your trip itinerary, activities, dining, and budget details!",
                intent="answer",
                instruction=None
            ), trace
