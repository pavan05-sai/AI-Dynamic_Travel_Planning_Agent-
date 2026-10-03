from typing import Any, Dict, List
from app.schemas.itinerary import CanonicalItinerary


class ItineraryDiffEngine:
    @classmethod
    def calculate_diff(cls, old_it: CanonicalItinerary, new_it: CanonicalItinerary) -> Dict[str, Any]:
        old_items = {it.id: (it, day.id) for day in old_it.days for it in day.items}
        new_items = {it.id: (it, day.id) for day in new_it.days for it in day.items}

        added = []
        removed = []
        modified = []

        # Find added
        for it_id, (it, day_id) in new_items.items():
            if it_id not in old_items:
                added.append({
                    "id": it.id,
                    "name": it.name,
                    "type": it.type,
                    "day_id": day_id,
                    "cost": it.cost.amount
                })

        # Find removed
        for it_id, (it, day_id) in old_items.items():
            if it_id not in new_items:
                removed.append({
                    "id": it.id,
                    "name": it.name,
                    "type": it.type,
                    "day_id": day_id,
                    "cost": it.cost.amount
                })

        # Find modified
        for it_id, (new_it_item, new_day_id) in new_items.items():
            if it_id in old_items:
                old_it_item, old_day_id = old_items[it_id]
                changes = {}
                if old_it_item.place_id != new_it_item.place_id:
                    changes["place"] = {"old": old_it_item.name, "new": new_it_item.name}
                if old_it_item.start_time != new_it_item.start_time:
                    changes["start_time"] = {"old": old_it_item.start_time, "new": new_it_item.start_time}
                if old_it_item.locked != new_it_item.locked:
                    changes["locked"] = {"old": old_it_item.locked, "new": new_it_item.locked}
                if old_day_id != new_day_id:
                    changes["day"] = {"old": old_day_id, "new": new_day_id}

                if changes:
                    modified.append({
                        "id": it_id,
                        "name": new_it_item.name,
                        "changes": changes
                    })

        # Budget delta
        cost_diff = new_it.budget.estimated_total - old_it.budget.estimated_total
        budget_delta = {
            "old_total": old_it.budget.estimated_total,
            "new_total": new_it.budget.estimated_total,
            "cost_difference": cost_diff,
            "old_status": old_it.budget.status,
            "new_status": new_it.budget.status
        }

        # Travel time delta
        old_travel_mins = sum(r.duration_min for d in old_it.days for r in d.routes)
        new_travel_mins = sum(r.duration_min for d in new_it.days for r in d.routes)
        travel_delta = {
            "old_travel_minutes": old_travel_mins,
            "new_travel_minutes": new_travel_mins,
            "travel_difference": new_travel_mins - old_travel_mins
        }

        # Human-readable summary
        summary_parts = []
        if added:
            summary_parts.append(f"Added {len(added)} item{'s' if len(added)>1 else ''}")
        if removed:
            summary_parts.append(f"Removed {len(removed)} item{'s' if len(removed)>1 else ''}")
        if modified:
            summary_parts.append(f"Modified {len(modified)} item{'s' if len(modified)>1 else ''}")
        if cost_diff != 0:
            if cost_diff < 0:
                summary_parts.append(f"Saved ₹{abs(cost_diff):,}")
            else:
                summary_parts.append(f"Added ₹{cost_diff:,} to cost")

        summary = ", ".join(summary_parts) if summary_parts else "No structural changes"

        return {
            "summary": summary,
            "added": added,
            "removed": removed,
            "modified": modified,
            "budget_delta": budget_delta,
            "travel_delta": travel_delta
        }
