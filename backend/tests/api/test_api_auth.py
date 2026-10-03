def test_auth_register_and_login(client):
    # Register
    reg_resp = client.post("/auth/register", json={
        "email": "newuser@example.com",
        "password": "secretpassword",
        "display_name": "New User"
    })
    assert reg_resp.status_code == 201
    data = reg_resp.json()
    assert data["ok"] is True
    assert "token" in data["data"]
    assert data["data"]["user"]["email"] == "newuser@example.com"

    # Login
    login_resp = client.post("/auth/login", json={
        "email": "newuser@example.com",
        "password": "secretpassword"
    })
    assert login_resp.status_code == 200
    login_data = login_resp.json()
    assert login_data["ok"] is True
    assert "token" in login_data["data"]


def test_auth_demo_login(client):
    resp = client.post("/auth/demo")
    assert resp.status_code == 200
    data = resp.json()
    assert data["ok"] is True
    assert "token" in data["data"]
    assert data["data"]["user"]["email"] == "demo@tripplanner.ai"


def test_users_me_and_preferences(client, auth_user):
    headers = auth_user["headers"]

    # Get me
    me_resp = client.get("/users/me", headers=headers)
    assert me_resp.status_code == 200
    assert me_resp.json()["data"]["email"] == auth_user["user"].email

    # Get preferences
    pref_resp = client.get("/users/me/preferences", headers=headers)
    assert pref_resp.status_code == 200
    assert "pace" in pref_resp.json()["data"]

    # Update preferences
    update_resp = client.put("/users/me/preferences", headers=headers, json={
        "interests": ["heritage", "nature"],
        "pace": "balanced",
        "budget_level": "luxury",
        "transport_modes": ["taxi"],
        "accommodation_type": "hotel",
        "dietary": ["vegetarian"],
        "avoid": ["nightclubs"],
        "mobility": "standard"
    })
    assert update_resp.status_code == 200
    assert update_resp.json()["data"]["pace"] == "balanced"
    assert update_resp.json()["data"]["budget_level"] == "luxury"
