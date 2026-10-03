import json
import os
import sys

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

REPLAY_DIR = os.path.join(backend_dir, "app", "data", "fixtures", "llm_replay")


def record_fixtures():
    os.makedirs(REPLAY_DIR, exist_ok=True)

    # 1. goa_baseline fixture
    goa_baseline = {
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

    # 2. goa_cheaper_day2 fixture
    goa_cheaper = {
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

    # 3. goa_rain_day3 fixture
    goa_rain = {
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

    with open(os.path.join(REPLAY_DIR, "goa_baseline.json"), "w", encoding="utf-8") as f:
        json.dump(goa_baseline, f, indent=2)

    with open(os.path.join(REPLAY_DIR, "goa_cheaper_day2.json"), "w", encoding="utf-8") as f:
        json.dump(goa_cheaper, f, indent=2)

    with open(os.path.join(REPLAY_DIR, "goa_rain_day3.json"), "w", encoding="utf-8") as f:
        json.dump(goa_rain, f, indent=2)

    print(f"Recorded replay fixtures saved to {REPLAY_DIR}")


if __name__ == "__main__":
    record_fixtures()
