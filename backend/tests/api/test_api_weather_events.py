def test_weather_and_event_simulation(client, auth_user):
    headers = auth_user["headers"]

    # 1. Create and generate trip
    create_resp = client.post("/trips", headers=headers, json={
        "destination_id": "dest_goa",
        "start_date": "2026-11-20",
        "end_date": "2026-11-23",
        "travelers": {"adults": 2, "children": 0},
        "budget": 35000,
        "title": "Weather Test Trip"
    })
    trip_id = create_resp.json()["data"]["trip_id"]
    client.post(f"/trips/{trip_id}/generate", headers=headers)

    # 2. Get Weather
    weather_resp = client.get(f"/trips/{trip_id}/weather", headers=headers)
    assert weather_resp.status_code == 200
    assert "forecast" in weather_resp.json()["data"]

    # 3. Simulate Rain on Day 3
    sim_resp = client.post(f"/trips/{trip_id}/events/simulate", headers=headers, json={
        "type": "weather",
        "day_id": "day_3",
        "severity": "high",
        "detail": "Heavy monsoon showers with 85% rain forecasted"
    })
    assert sim_resp.status_code == 200
    sim_data = sim_resp.json()["data"]
    assert sim_data["event"]["type"] == "weather"
    assert sim_data["itinerary"] is not None
    # Version should have incremented
    assert sim_data["itinerary"]["version"] >= 2

    # 4. Check Notifications generated
    noti_resp = client.get("/notifications", headers=headers)
    assert noti_resp.status_code == 200
    notis = noti_resp.json()["data"]
    assert len(notis) >= 1
    assert any("Weather Alert" in n["title"] or "Itinerary Updated" in n["title"] for n in notis)
