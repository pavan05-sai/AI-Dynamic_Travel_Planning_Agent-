def test_destinations_list(client):
    resp = client.get("/destinations")
    assert resp.status_code == 200
    data = resp.json()
    assert data["ok"] is True
    assert len(data["data"]) >= 3
    ids = [d["id"] for d in data["data"]]
    assert "dest_goa" in ids


def test_trip_crud_and_ownership(client, auth_user, other_user):
    headers_a = auth_user["headers"]
    headers_b = other_user["headers"]

    # 1. Create Trip for User A
    create_resp = client.post("/trips", headers=headers_a, json={
        "destination_id": "dest_goa",
        "start_date": "2026-11-20",
        "end_date": "2026-11-23",
        "travelers": {"adults": 2, "children": 0},
        "budget": 30000,
        "title": "My Goa Vacation"
    })
    assert create_resp.status_code == 201
    trip_id = create_resp.json()["data"]["trip_id"]

    # 2. User A can get trip
    get_resp = client.get(f"/trips/{trip_id}", headers=headers_a)
    assert get_resp.status_code == 200
    assert get_resp.json()["data"]["trip"]["title"] == "My Goa Vacation"

    # 3. User B cannot get User A's trip -> returns 404 per Section 18
    other_resp = client.get(f"/trips/{trip_id}", headers=headers_b)
    assert other_resp.status_code == 404
    assert other_resp.json()["ok"] is False

    # 4. Infeasible budget validation
    bad_budget_resp = client.post("/trips", headers=headers_a, json={
        "destination_id": "dest_goa",
        "start_date": "2026-11-20",
        "end_date": "2026-11-23",
        "travelers": {"adults": 2, "children": 0},
        "budget": 2000  # Infeasible for 4 days
    })
    assert bad_budget_resp.status_code == 422
    assert bad_budget_resp.json()["error"]["code"] == "BUDGET_INVALID"
