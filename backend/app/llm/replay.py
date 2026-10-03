import json
import os
from typing import Any, Dict, Optional
from app.llm.base import LLMProvider

FIXTURES_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "fixtures", "llm_replay")


class ReplayProvider(LLMProvider):
    def __init__(self):
        self.fixtures = {}
        if os.path.exists(FIXTURES_DIR):
            for fname in os.listdir(FIXTURES_DIR):
                if fname.endswith(".json"):
                    try:
                        with open(os.path.join(FIXTURES_DIR, fname), "r", encoding="utf-8") as f:
                            key = fname[:-5]
                            self.fixtures[key] = json.load(f)
                    except Exception:
                        pass

    def generate_json(
        self,
        prompt: str,
        schema: Optional[Dict[str, Any]] = None,
        system_instruction: Optional[str] = None
    ) -> Dict[str, Any]:
        prompt_lower = prompt.lower()
        sys_lower = (system_instruction or "").lower()

        # 0. Concierge request
        if "concierge" in sys_lower or "classify user intent" in prompt_lower:
            user_msg = ""
            if 'user message: "' in prompt_lower:
                user_msg = prompt_lower.split('user message: "')[1].split('"')[0]
            else:
                user_msg = prompt_lower

            if any(k in user_msg for k in ["cheaper", "modify", "remove", "add", "replace", "swap", "change"]):
                instruction = "Make Day 2 cheaper" if "cheaper" in user_msg else "Adjust itinerary per user request"
                return {
                    "text": "I can certainly adjust that for you. Applying your changes now.",
                    "intent": "modify",
                    "instruction": instruction
                }
            elif any(k in user_msg for k in ["why", "what", "how", "tell", "explain", "when"]):
                return {
                    "text": "Fort Aguada was selected for Day 1 because it offers spectacular coastal views, historic Portuguese architecture, and is situated near your Candolim hotel for effortless morning access.",
                    "intent": "answer",
                    "instruction": None
                }
            else:
                return {
                    "text": "I am your AI travel concierge. How can I help customize your itinerary?",
                    "intent": "answer",
                    "instruction": None
                }

        # 1. Replanner request
        if "replanner" in sys_lower or "propose a minimal changeset" in prompt_lower:
            trigger_text = ""
            if 'trigger / instruction: "' in prompt_lower:
                trigger_text = prompt_lower.split('trigger / instruction: "')[1].split('"')[0]
            else:
                trigger_text = prompt_lower

            if any(k in trigger_text for k in ["rain", "monsoon", "weather", "shower", "storm"]):
                if "goa_rain_day3" in self.fixtures:
                    return self.fixtures["goa_rain_day3"]
                return {
                    "ops": [
                        {
                            "op": "REPLACE_ITEM",
                            "item_id": "it_d3_01",
                            "new_place_id": "poi_goa_houses_museum"
                        }
                    ],
                    "rationale": "Swapped outdoor beach for Houses of Goa Museum due to forecasted rain.",
                    "expected_effects": {"weather_adapted": True, "saved_cost": 0}
                }
            if any(k in trigger_text for k in ["cheaper", "budget", "cost", "save", "lower"]):
                if "goa_cheaper_day2" in self.fixtures:
                    return self.fixtures["goa_cheaper_day2"]
                return {
                    "ops": [
                        {
                            "op": "REPLACE_ITEM",
                            "item_id": "it_d2_02",
                            "new_place_id": "rest_goa_vinayak"
                        }
                    ],
                    "rationale": "Substituted dining option with authentic budget-friendly Vinayak Family Restaurant to lower costs.",
                    "expected_effects": {"cost_delta": -400}
                }

        # 2. Planner request
        if "planner" in sys_lower or "trip request" in prompt_lower or "select 1 hotel" in prompt_lower:
            if "goa_baseline" in self.fixtures:
                return self.fixtures["goa_baseline"]

        # Default structured selection
        if "goa_baseline" in self.fixtures:
            return self.fixtures["goa_baseline"]
        return {
            "hotel_id": "hotel_goa_02",
            "hotel_reason": "Central location in Candolim, excellent pool, and walkable beach access.",
            "days": [
                {
                    "day_number": 1,
                    "theme": "Old Goa Heritage & Panaji Culture",
                    "activity_ids": ["poi_goa_basilica", "poi_goa_fontainhas"],
                    "meal_ids": ["rest_goa_fisherman_wharf", "rest_goa_mum_kitchen"],
                    "reasons": {
                        "poi_goa_basilica": "Remarkable 16th-century baroque architecture.",
                        "poi_goa_fontainhas": "Charming colonial Portuguese streetscapes.",
                        "rest_goa_fisherman_wharf": "Riverside dining with fresh Goan seafood.",
                        "rest_goa_mum_kitchen": "Authentic heirloom Goan recipes."
                    },
                    "reason_factors": {
                        "poi_goa_basilica": ["interest:heritage", "rating:4.8"],
                        "poi_goa_fontainhas": ["interest:heritage", "scenic:outdoor"]
                    }
                },
                {
                    "day_number": 2,
                    "theme": "Coastal Forts & Beach Vistas",
                    "activity_ids": ["poi_goa_fort_aguada", "poi_goa_calangute_beach"],
                    "meal_ids": ["rest_goa_souza_lobo", "rest_goa_gunpowder"],
                    "reasons": {
                        "poi_goa_fort_aguada": "Historic Portuguese ocean fortress.",
                        "poi_goa_calangute_beach": "Iconic beach experience.",
                        "rest_goa_souza_lobo": "Beachfront dining institution.",
                        "rest_goa_gunpowder": "Coastal South Indian specialties in garden courtyard."
                    },
                    "reason_factors": {
                        "poi_goa_fort_aguada": ["interest:heritage", "views:scenic"],
                        "poi_goa_calangute_beach": ["interest:beaches"]
                    }
                }
            ],
            "alternative_themes": [
                {
                    "id": "alt_nature",
                    "label": "Nature & Spice Trails",
                    "summary": "Focuses on Dudhsagar waterfalls and Sahakari spice farm.",
                    "ops": []
                }
            ]
        }

    def generate_text(
        self,
        prompt: str,
        system_instruction: Optional[str] = None
    ) -> str:
        prompt_lower = prompt.lower()
        if "why" in prompt_lower:
            return "Fort Aguada was selected for Day 1 because it offers spectacular ocean panoramas, historic Portuguese architecture, and is situated near your Candolim hotel for effortless morning access."
        if "cheaper" in prompt_lower:
            return "I have optimized Day 2 by substituting higher-priced activities with high-rated local favorites like Vinayak, saving approximately ₹400 while keeping the experience authentic."
        return "I am your AI travel concierge. I can adjust your schedule, optimize your budget, or answer any questions about your destinations!"
