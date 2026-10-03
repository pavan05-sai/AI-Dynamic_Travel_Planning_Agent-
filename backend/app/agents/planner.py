import json
from typing import Any, Dict, List, Optional, Tuple
from app.agents.base import BaseAgent
from app.core.logging import get_logger
from app.schemas.changeset import PlannerSelection
from app.schemas.itinerary import Travelers
from app.schemas.preferences import PreferencesSchema
from app.tools.registry import ToolRegistry

logger = get_logger("planner_agent")


class PlannerAgent(BaseAgent):
    def __init__(self):
        super().__init__(name="Planner", prompt_file="planner.txt")

    def plan_trip(
        self,
        destination_name: str,
        destination_id: str,
        num_days: int,
        travelers: Travelers,
        budget: int,
        preferences: PreferencesSchema,
        tool_registry: ToolRegistry
    ) -> Tuple[Optional[PlannerSelection], List[str]]:
        tools = tool_registry.get_tool_for_agent("planner")
        trace: List[str] = [f"Planner Agent starting plan for {num_days} days in {destination_name}"]

        # 1. Fetch Candidates via Tool
        trace.append("Retrieving candidates for hotels, attractions, and dining")
        hotels = tool_registry.get_candidates(kind="hotel", limit=6)
        attractions = tool_registry.get_candidates(kind="attraction", limit=20)
        restaurants = tool_registry.get_candidates(kind="restaurant", limit=15)
        weather = tool_registry.get_weather()

        prompt = f"""
Trip Request:
- Destination: {destination_name} (ID: {destination_id})
- Duration: {num_days} days
- Travelers: {travelers.adults} adults, {travelers.children} children
- Total Budget: INR {budget}
- Preferences:
  Pace: {preferences.pace}
  Interests: {preferences.interests}
  Budget Level: {preferences.budget_level}
  Dietary: {preferences.dietary}
  Avoid: {preferences.avoid}

Available Hotels (IDs and details):
{json.dumps([{"id": h["id"], "name": h["name"], "cost": h["cost_amount"], "rating": h["rating"]} for h in hotels], indent=2)}

Available Attractions (IDs and details):
{json.dumps([{"id": a["id"], "name": a["name"], "cost": a["cost_amount"], "category": a["category"], "tags": a["tags"]} for a in attractions], indent=2)}

Available Dining (IDs and details):
{json.dumps([{"id": r["id"], "name": r["name"], "cost": r["cost_amount"], "tags": r["tags"]} for r in restaurants], indent=2)}

Weather Forecast:
{json.dumps(weather, indent=2)}

Select 1 hotel and distinct activities and dining for each of the {num_days} days. Follow schema rules strictly.
"""

        result_json, agent_trace = self.run_tool_loop(prompt, tools)
        trace.extend(agent_trace)

        try:
            selection = PlannerSelection(**result_json)
            trace.append("Planner successfully assembled selection")
            return selection, trace
        except Exception as e:
            trace.append(f"Validation error on planner output: {e}. Falling back to baseline planner.")
            logger.warning(f"PlannerSelection validation error: {e}")
            return None, trace
