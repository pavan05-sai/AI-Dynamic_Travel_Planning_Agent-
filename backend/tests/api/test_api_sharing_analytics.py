def test_sharing_flow(client, auth_user):
    headers = auth_user["headers"]

    # 1. Create and generate trip
    create_resp = client.post("/trips", headers=headers, json={
        "destination_id": "dest_goa",
        "start_date": "2026-11-20",
        "end_date": "2026-11-23",
        "travelers": {"adults": 2, "children": 0},
        "budget": 35000,
        "title": "Share Test Trip"
    })
    trip_id = create_resp.json()["data"]["trip_id"]
    client.post(f"/trips/{trip_id}/generate", headers=headers)

    # 2. Create Share Token
    share_resp = client.post(f"/trips/{trip_id}/share", headers=headers, json={"expiry_days": 10})
    assert share_resp.status_code == 200
    token = share_resp.json()["data"]["token"]
    assert len(token) > 10

    # 3. View shared itinerary without auth (public read-only)
    public_resp = client.get(f"/shared/{token}")
    assert public_resp.status_code == 200
    public_data = public_resp.json()["data"]
    assert public_data["shared"] is True
    assert "itinerary" in public_data
    # Verify user email is NOT exposed in shared view
    assert "user_email" not in public_data["itinerary"]

    # 4. Revoke Share Link
    revoke_resp = client.delete(f"/trips/{trip_id}/share", headers=headers)
    assert revoke_resp.status_code == 200

    # 5. Accessing revoked token should return 404
    after_revoke_resp = client.get(f"/shared/{token}")
    assert after_revoke_resp.status_code == 404


def test_expenses_and_analytics(client, auth_user):
    headers = auth_user["headers"]

    # 1. Create and generate trip
    create_resp = client.post("/trips", headers=headers, json={
        "destination_id": "dest_goa",
        "start_date": "2026-11-20",
        "end_date": "2026-11-23",
        "travelers": {"adults": 2, "children": 0},
        "budget": 35000,
        "title": "Expense Test Trip"
    })
    trip_id = create_resp.json()["data"]["trip_id"]
    client.post(f"/trips/{trip_id}/generate", headers=headers)

    # 2. Log expenses
    e1 = client.post(f"/trips/{trip_id}/expenses", headers=headers, json={
        "category": "food",
        "amount": 950,
        "day_id": "day_1",
        "note": "Lunch at Souza Lobo"
    })
    assert e1.status_code == 201

    e2 = client.post(f"/trips/{trip_id}/expenses", headers=headers, json={
        "category": "transport",
        "amount": 400,
        "day_id": "day_1",
        "note": "Taxi"
    })
    assert e2.status_code == 201

    # 3. List expenses
    exp_list = client.get(f"/trips/{trip_id}/expenses", headers=headers)
    assert exp_list.status_code == 200
    assert exp_list.json()["data"]["total_spent"] == 1350

    # 4. Analytics
    analytics_resp = client.get(f"/trips/{trip_id}/analytics", headers=headers)
    assert analytics_resp.status_code == 200
    an_data = analytics_resp.json()["data"]
    assert an_data["planned_vs_actual"]["actual_total"] == 1350
    assert "time_distribution" in an_data
