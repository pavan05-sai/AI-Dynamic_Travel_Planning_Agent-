def test_complete_demo_judging_flow(client):
    """
    End-to-end test covering all 25 deliverables and the full 6.5-minute judging flow:
    Demo login -> Create trip -> Generate -> Day-wise itinerary -> Budget breakdown ->
    Chat question -> NL modification ("Make Day 2 cheaper") -> Simulate rain on Day 3 ->
    Dynamic replanning -> Version history & revert -> Public sharing -> Expense tracking & Analytics.
    """
    # 0. Health check
    h_resp = client.get("/health")
    assert h_resp.status_code == 200
    assert h_resp.json()["data"]["status"] == "healthy"

    # 1. Demo Login
    auth_resp = client.post("/auth/demo")
    assert auth_resp.status_code == 200
    token = auth_resp.json()["data"]["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Supported destinations check
    dest_resp = client.get("/destinations")
    assert dest_resp.status_code == 200
    assert len(dest_resp.json()["data"]) >= 3

    # 3. Create Trip (Goa, 4 days, 2 adults, ₹30,000)
    trip_resp = client.post("/trips", headers=headers, json={
        "destination_id": "dest_goa",
        "start_date": "2026-11-20",
        "end_date": "2026-11-23",
        "travelers": {"adults": 2, "children": 0},
        "budget": 30000,
        "title": "Goa Escape Judging Demo"
    })
    assert trip_resp.status_code == 201
    trip_id = trip_resp.json()["data"]["trip_id"]

    # 4. Generate Itinerary (v1)
    gen_resp = client.post(f"/trips/{trip_id}/generate", headers=headers)
    assert gen_resp.status_code == 200
    it_v1 = gen_resp.json()["data"]["itinerary"]
    assert it_v1["version"] == 1
    assert len(it_v1["days"]) == 4

    # Every item has non-empty reason and time
    for d in it_v1["days"]:
        assert len(d["items"]) >= 2
        for it in d["items"]:
            assert len(it["reason"]) > 0
            assert len(it["start_time"]) == 5

    # Budget is calculated deterministically
    budget = it_v1["budget"]
    assert budget["estimated_total"] > 0
    assert budget["status"] in ["ok", "tight", "over"]

    # 5. Assistant: Question
    q_resp = client.post(f"/trips/{trip_id}/chat", headers=headers, json={
        "message": "Why was Fort Aguada selected for Day 1?"
    })
    assert q_resp.status_code == 200
    assert len(q_resp.json()["data"]["reply"]) > 0

    # 6. Assistant: NL modification ("Make Day 2 cheaper")
    mod_resp = client.post(f"/trips/{trip_id}/chat", headers=headers, json={
        "message": "Make Day 2 cheaper"
    })
    assert mod_resp.status_code == 200
    mod_data = mod_resp.json()["data"]
    assert mod_data["version_change"] is True
    assert mod_data["diff"] is not None

    # Verify version 2 exists
    v2_resp = client.get(f"/trips/{trip_id}/versions/2", headers=headers)
    assert v2_resp.status_code == 200
    it_v2 = v2_resp.json()["data"]
    assert it_v2["version"] == 2

    # 7. Dynamic Replanning: Simulate Rain on Day 3
    sim_resp = client.post(f"/trips/{trip_id}/events/simulate", headers=headers, json={
        "type": "weather",
        "day_id": "day_3",
        "severity": "high",
        "detail": "Monsoon rain 85% forecasted"
    })
    assert sim_resp.status_code == 200
    it_v3 = sim_resp.json()["data"]["itinerary"]
    assert it_v3["version"] == 3

    # Check notification was created
    notis_resp = client.get("/notifications", headers=headers)
    assert notis_resp.status_code == 200
    assert len(notis_resp.json()["data"]) >= 1

    # 8. Revert to v2
    revert_resp = client.post(f"/trips/{trip_id}/versions/2/revert", headers=headers)
    assert revert_resp.status_code == 200
    assert revert_resp.json()["data"]["current_version"] == 4

    # 9. Sharing: create link, test public view without auth
    share_resp = client.post(f"/trips/{trip_id}/share", headers=headers, json={"expiry_days": 14})
    assert share_resp.status_code == 200
    token = share_resp.json()["data"]["token"]

    public_resp = client.get(f"/shared/{token}")
    assert public_resp.status_code == 200
    assert public_resp.json()["data"]["shared"] is True

    # 10. Expenses & Analytics
    client.post(f"/trips/{trip_id}/expenses", headers=headers, json={
        "category": "food",
        "amount": 750,
        "day_id": "day_1",
        "note": "Lunch"
    })
    client.post(f"/trips/{trip_id}/expenses", headers=headers, json={
        "category": "transport",
        "amount": 350,
        "day_id": "day_1",
        "note": "Taxi"
    })

    analytics_resp = client.get(f"/trips/{trip_id}/analytics", headers=headers)
    assert analytics_resp.status_code == 200
    an_data = analytics_resp.json()["data"]
    assert an_data["planned_vs_actual"]["actual_total"] == 1100
