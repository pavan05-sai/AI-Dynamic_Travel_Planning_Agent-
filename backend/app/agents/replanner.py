import json
from typing import Any, Dict, List, Optional, Tuple
from app.agents.base import BaseAgent
from app.core.logging import get_logger
from app.schemas.changeset import ChangeSet
from app.schemas.itinerary import CanonicalItinerary
from app.tools.registry import ToolRegistry

logger = get_logger("replanner_agent")


class ReplannerAgent(BaseAgent):
    def __init__(self):
        super().__init__(name="Replanner", prompt_file="replanner.txt")

    def replan(
        self,
        itinerary: CanonicalItinerary,
        instruction: str,
        tool_registry: ToolRegistry,
        event_payload: Optional[Dict[str, Any]] = None
    ) -> Tuple[Optional[ChangeSet], List[str]]:
        tools = tool_registry.get_tool_for_agent("replanner")
        trace: List[str] = [f"Replanner Agent received trigger: '{instruction}'"]

        current_summary = []
        for day in itinerary.days:
            day_info = {
                "day_id": day.id,
                "day_number": day.day_number,
                "weather": day.weather.summary if day.weather else "Clear",
                "rain_prob": day.weather.rain_prob_pct if day.weather else 0,
                "items": [{"id": it.id, "name": it.name, "place_id": it.place_id, "category": it.category, "indoor": it.indoor, "cost": it.cost.amount, "locked": it.locked} for it in day.items]
            }
            current_summary.append(day_info)

        candidates = tool_registry.get_candidates(limit=15)

        prompt = f"""
Current Itinerary Overview:
{json.dumps(current_summary, indent=2)}

Budget Status: {itinerary.budget.status} (Total: ₹{itinerary.budget.estimated_total} / Limit: ₹{itinerary.budget.total_limit})
Trigger / Instruction: "{instruction}"
Event Details: {json.dumps(event_payload or {}, indent=2)}

Available Candidate Places for substitution or additions:
{json.dumps([{"id": c["id"], "name": c["name"], "cost": c["cost_amount"], "indoor": c["indoor"], "category": c["category"]} for c in candidates], indent=2)}

Propose a minimal ChangeSet using valid operations. DO NOT modify locked items.
"""

        result_json, agent_trace = self.run_tool_loop(prompt, tools)
        trace.extend(agent_trace)

        try:
            changeset = ChangeSet(**result_json)
            trace.append(f"Replanner proposed {len(changeset.ops)} operations: {changeset.rationale}")
            return changeset, trace
        except Exception as e:
            trace.append(f"Validation error on replanner output: {e}")
            logger.warning(f"ChangeSet validation error: {e}")
            return None, trace
