import json
import os
import sys

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SEED_DIR = os.path.join(backend_dir, "app", "data", "seed")


def verify_seeds():
    print("Verifying seed catalogs...")
    files = ["places_goa.json", "places_jaipur.json", "places_hyderabad.json"]
    total = 0
    errors = 0

    for fname in files:
        fpath = os.path.join(SEED_DIR, fname)
        if not os.path.exists(fpath):
            print(f"Missing {fname}!")
            errors += 1
            continue

        with open(fpath, "r", encoding="utf-8") as f:
            places = json.load(f)
            print(f"{fname}: {len(places)} places")
            for p in places:
                total += 1
                if not (-90 <= p["lat"] <= 90 and -180 <= p["lng"] <= 180):
                    print(f"Invalid coordinates in {p['id']}: ({p['lat']}, {p['lng']})")
                    errors += 1
                if p["cost_amount"] < 0:
                    print(f"Invalid cost in {p['id']}: {p['cost_amount']}")
                    errors += 1

    print(f"Verification complete: {total} places checked, {errors} errors found.")


if __name__ == "__main__":
    verify_seeds()
