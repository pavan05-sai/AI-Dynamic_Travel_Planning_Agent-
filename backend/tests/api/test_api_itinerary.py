def test_generate_and_versioning(client, auth_user):
    headers = auth_user["headers"]

    # 1. Create Trip
    create_resp = client.post("/trips", headers=headers, json={
        "destination_id": "dest_goa",
        "start_date": "2026-11-20",
        "end_date": "2026-11-23",
        "travelers": {"adults": 2, "children": 0},
        "budget": 35000,
        "title": "Goa Version Test"
    })
    trip_id = create_resp.json()["data"]["trip_id"]

    # 2. Generate Itinerary (v1)
    gen_resp = client.post(f"/trips/{trip_id}/generate", headers=headers)
    assert gen_resp.status_code == 200
    gen_data = gen_resp.json()
    assert gen_data["ok"] is True
    assert gen_data["data"]["itinerary"]["version"] == 1
    assert len(gen_data["data"]["itinerary"]["days"]) == 4
    assert len(gen_data["data"]["alternatives"]) >= 1

    # 3. List versions
    versions_resp = client.get(f"/trips/{trip_id}/versions", headers=headers)
    assert versions_resp.status_code == 200
    assert len(versions_resp.json()["data"]) == 1

    # 4. Patch Item (Lock item)
    first_item_id = gen_data["data"]["itinerary"]["days"][0]["items"][0]["id"]
    patch_resp = client.patch(
        f"/trips/{trip_id}/items/{first_item_id}",
        headers=headers,
        json={"op": "LOCK_ITEM"}
    )
    assert patch_resp.status_code == 200
    # Version should increment to v2
    assert patch_resp.json()["data"]["itinerary"]["version"] == 2

    # 5. Diff between v1 and v2
    diff_resp = client.get(f"/trips/{trip_id}/diff?from=1&to=2", headers=headers)
    assert diff_resp.status_code == 200
    diff_data = diff_resp.json()["data"]
    assert "modified" in diff_data or "summary" in diff_data

    # 6. Revert to v1 (creates v3 as copy of v1)
    revert_resp = client.post(f"/trips/{trip_id}/versions/1/revert", headers=headers)
    assert revert_resp.status_code == 200
    assert revert_resp.json()["data"]["current_version"] == 3
    assert revert_resp.json()["data"]["reverted_to"] == 1
