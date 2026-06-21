from fastapi.testclient import TestClient

EMAIL = "alice@example.com"
PASSWORD = "supersecret123"


def _register(client: TestClient, **overrides: object) -> dict:
    payload = {"email": EMAIL, "password": PASSWORD, "display_name": "Alice"}
    payload.update(overrides)
    return client.post("/api/v1/auth/register", json=payload).json()


def test_register_returns_tokens_and_user(client: TestClient) -> None:
    res = client.post(
        "/api/v1/auth/register",
        json={"email": EMAIL, "password": PASSWORD, "display_name": "Alice"},
    )
    assert res.status_code == 201
    body = res.json()
    assert body["access_token"] and body["refresh_token"]
    assert body["user"]["email"] == EMAIL


def test_register_requires_identifier(client: TestClient) -> None:
    res = client.post("/api/v1/auth/register", json={"password": PASSWORD})
    assert res.status_code == 422


def test_register_duplicate_email(client: TestClient) -> None:
    _register(client)
    res = client.post(
        "/api/v1/auth/register", json={"email": EMAIL, "password": PASSWORD}
    )
    assert res.status_code == 409


def test_login_success_and_me(client: TestClient) -> None:
    _register(client)
    res = client.post(
        "/api/v1/auth/login", json={"identifier": EMAIL, "password": PASSWORD}
    )
    assert res.status_code == 200
    token = res.json()["access_token"]

    me = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
    assert me.json()["email"] == EMAIL


def test_login_wrong_password(client: TestClient) -> None:
    _register(client)
    res = client.post(
        "/api/v1/auth/login", json={"identifier": EMAIL, "password": "wrong-pass-123"}
    )
    assert res.status_code == 401


def test_me_requires_auth(client: TestClient) -> None:
    assert client.get("/api/v1/auth/me").status_code == 403


def test_refresh_rotates_tokens(client: TestClient) -> None:
    tokens = _register(client)
    res = client.post(
        "/api/v1/auth/refresh", json={"refresh_token": tokens["refresh_token"]}
    )
    assert res.status_code == 200
    assert res.json()["access_token"]


def test_forgot_and_reset_password(client: TestClient) -> None:
    _register(client)
    forgot = client.post("/api/v1/auth/forgot-password", json={"email": EMAIL})
    assert forgot.status_code == 200
    reset_token = forgot.json()["reset_token"]

    new_password = "brandnewpass456"
    reset = client.post(
        "/api/v1/auth/reset-password",
        json={"token": reset_token, "password": new_password},
    )
    assert reset.status_code == 200

    old = client.post(
        "/api/v1/auth/login", json={"identifier": EMAIL, "password": PASSWORD}
    )
    assert old.status_code == 401
    new = client.post(
        "/api/v1/auth/login", json={"identifier": EMAIL, "password": new_password}
    )
    assert new.status_code == 200
