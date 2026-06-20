from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health() -> None:
    res = client.get("/api/v1/health")
    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "ok"


def test_root() -> None:
    res = client.get("/")
    assert res.status_code == 200
    assert "name" in res.json()
