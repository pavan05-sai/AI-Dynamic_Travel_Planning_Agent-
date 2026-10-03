def test_chat_question_and_modification(client, auth_user):
    headers = auth_user["headers"]

    # 1. Create and generate trip
    create_resp = client.post("/trips", headers=headers, json={
        "destination_id": "dest_goa",
        "start_date": "2026-11-20",
        "end_date": "2026-11-23",
        "travelers": {"adults": 2, "children": 0},
        "budget": 35000,
        "title": "Chat Test Trip"
    })
    trip_id = create_resp.json()["data"]["trip_id"]
    client.post(f"/trips/{trip_id}/generate", headers=headers)

    # 2. Chat Question (intent = answer)
    q_resp = client.post(f"/trips/{trip_id}/chat", headers=headers, json={
        "message": "Why was Fort Aguada selected for Day 1?"
    })
    assert q_resp.status_code == 200
    q_data = q_resp.json()["data"]
    assert q_data["intent"] in ["answer", "clarify"]
    assert len(q_data["reply"]) > 0
    assert q_data["version_change"] is False

    # 3. Chat Modification (intent = modify: "Make Day 2 cheaper")
    mod_resp = client.post(f"/trips/{trip_id}/chat", headers=headers, json={
        "message": "Make Day 2 cheaper"
    })
    assert mod_resp.status_code == 200
    mod_data = mod_resp.json()["data"]
    assert mod_data["intent"] == "modify"
    # Should result in version change
    assert mod_data["version_change"] is True
    assert mod_data["diff"] is not None

    # 4. Get Chat History
    hist_resp = client.get(f"/trips/{trip_id}/chat", headers=headers)
    assert hist_resp.status_code == 200
    messages = hist_resp.json()["data"]
    assert len(messages) >= 4  # 2 user messages + 2 assistant replies
