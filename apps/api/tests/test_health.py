from fastapi.testclient import TestClient


def test_health(client: TestClient) -> None:
    res = client.get("/api/v1/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"


def test_root(client: TestClient) -> None:
    res = client.get("/")
    assert res.status_code == 200
    assert "name" in res.json()
