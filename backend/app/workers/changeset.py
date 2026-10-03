import copy
from typing import Dict, List, Optional, Set, Tuple
from app.core.errors import ValidationError
from app.models.entities import Place
from app.schemas.changeset import ChangeOp, ChangeSet, OpType
from app.schemas.itinerary import CanonicalItinerary, ItineraryItem, ItemCost, BookingRef


class ChangeSetApplier:
    MAX_OPS = 8

    @classmethod
    def apply_changeset(
        cls,
        itinerary: CanonicalItinerary,
        changeset: ChangeSet,
        catalog_places: Dict[str, Place]
    ) -> Tuple[CanonicalItinerary, Set[int]]:
        """
        Applies ops to a deepcopy of itinerary.
        Returns: (new_itinerary, affected_day_numbers)
        """
        if len(changeset.ops) > cls.MAX_OPS:
            raise ValidationError(
                message=f"ChangeSet exceeds maximum allowed operations ({cls.MAX_OPS})",
                code="CHANGESET_TOO_LARGE"
            )

        new_it = copy.deepcopy(itinerary)
        affected_days: Set[int] = set()

        # Map days and items
        day_by_id = {d.id: d for d in new_it.days}
        day_by_num = {d.day_number: d for d in new_it.days}

        def find_item(item_id: str) -> Tuple[Optional[ItineraryItem], Optional[int]]:
            for d in new_it.days:
                for it in d.items:
                    if it.id == item_id:
                        return it, d.day_number
            return None, None

        for op in changeset.ops:
            if op.op == OpType.ADD_ITEM:
                target_day = day_by_id.get(op.day_id)
                if not target_day:
                    raise ValidationError(f"Day '{op.day_id}' not found in itinerary", code="DAY_NOT_FOUND")
                place = catalog_places.get(op.place_id)
                if not place:
                    raise ValidationError(f"Place '{op.place_id}' not found in catalog", code="PLACE_NOT_FOUND")

                new_item_id = f"it_d{target_day.day_number}_{len(target_day.items)+1:02d}"
                new_item = ItineraryItem(
                    id=new_item_id,
                    type="activity" if place.kind == "attraction" else "meal",
                    place_id=place.id,
                    name=place.name,
                    category=place.category,
                    lat=place.lat,
                    lng=place.lng,
                    start_time="14:00",
                    end_time="15:30",
                    duration_min=place.duration_min or 90,
                    indoor=place.indoor,
                    cost=ItemCost(amount=place.cost_amount or 0, per=place.cost_per or "person", basis="catalog"),
                    reason=f"Added based on your preferences: {place.name}",
                    reason_factors=[f"category:{place.category}"],
                    locked=False,
                    booking=BookingRef(url=place.booking_url) if place.booking_url else None
                )
                if op.position is not None and 0 <= op.position <= len(target_day.items):
                    target_day.items.insert(op.position, new_item)
                else:
                    target_day.items.append(new_item)
                affected_days.add(target_day.day_number)

            elif op.op == OpType.REMOVE_ITEM:
                item, day_num = find_item(op.item_id)
                if not item or day_num is None:
                    raise ValidationError(f"Item '{op.item_id}' not found", code="ITEM_NOT_FOUND")
                if item.locked:
                    raise ValidationError(f"Cannot remove locked item '{item.name}'", code="ITEM_LOCKED")

                day = day_by_num[day_num]
                day.items = [i for i in day.items if i.id != op.item_id]
                affected_days.add(day_num)

            elif op.op == OpType.REPLACE_ITEM:
                item, day_num = find_item(op.item_id)
                if not item or day_num is None:
                    raise ValidationError(f"Item '{op.item_id}' not found", code="ITEM_NOT_FOUND")
                if item.locked:
                    raise ValidationError(f"Cannot replace locked item '{item.name}'", code="ITEM_LOCKED")

                new_place = catalog_places.get(op.new_place_id)
                if not new_place:
                    raise ValidationError(f"New place '{op.new_place_id}' not found in catalog", code="PLACE_NOT_FOUND")

                item.place_id = new_place.id
                item.name = new_place.name
                item.category = new_place.category
                item.lat = new_place.lat
                item.lng = new_place.lng
                item.indoor = new_place.indoor
                item.duration_min = new_place.duration_min or 90
                item.cost = ItemCost(amount=new_place.cost_amount or 0, per=new_place.cost_per or "person", basis="catalog")
                item.reason = f"Replaced with {new_place.name} to better match your plans."
                item.reason_factors = [f"category:{new_place.category}"]
                if new_place.booking_url:
                    item.booking = BookingRef(url=new_place.booking_url)
                affected_days.add(day_num)

            elif op.op == OpType.MOVE_ITEM:
                item, from_day_num = find_item(op.item_id)
                if not item or from_day_num is None:
                    raise ValidationError(f"Item '{op.item_id}' not found", code="ITEM_NOT_FOUND")
                if item.locked:
                    raise ValidationError(f"Cannot move locked item '{item.name}'", code="ITEM_LOCKED")

                to_day = day_by_id.get(op.to_day_id)
                if not to_day:
                    raise ValidationError(f"Target day '{op.to_day_id}' not found", code="DAY_NOT_FOUND")

                from_day = day_by_num[from_day_num]
                from_day.items = [i for i in from_day.items if i.id != op.item_id]
                item.id = f"it_d{to_day.day_number}_{len(to_day.items)+1:02d}"

                if op.position is not None and 0 <= op.position <= len(to_day.items):
                    to_day.items.insert(op.position, item)
                else:
                    to_day.items.append(item)

                affected_days.add(from_day_num)
                affected_days.add(to_day.day_number)

            elif op.op == OpType.SET_BUDGET:
                if op.total_limit and op.total_limit > 0:
                    new_it.budget.total_limit = op.total_limit
                    # All days affected for budget recalculation
                    for d in new_it.days:
                        affected_days.add(d.day_number)

            elif op.op == OpType.SET_PREFERENCE:
                if op.key and hasattr(new_it.preferences, op.key):
                    setattr(new_it.preferences, op.key, op.value)
                    for d in new_it.days:
                        affected_days.add(d.day_number)

            elif op.op == OpType.SET_ACCOMMODATION:
                hotel = catalog_places.get(op.place_id)
                if not hotel:
                    raise ValidationError(f"Hotel '{op.place_id}' not found", code="HOTEL_NOT_FOUND")
                new_it.accommodation.place_id = hotel.id
                new_it.accommodation.name = hotel.name
                new_it.accommodation.nightly_cost = hotel.cost_amount
                new_it.accommodation.reason = f"Updated accommodation to {hotel.name}"
                for d in new_it.days:
                    affected_days.add(d.day_number)

            elif op.op == OpType.LOCK_ITEM:
                item, _ = find_item(op.item_id)
                if item:
                    item.locked = True

            elif op.op == OpType.UNLOCK_ITEM:
                item, _ = find_item(op.item_id)
                if item:
                    item.locked = False

            elif op.op == OpType.REGENERATE_DAY:
                target_day = day_by_id.get(op.day_id)
                if target_day:
                    affected_days.add(target_day.day_number)

        return new_it, affected_days
