from __future__ import annotations

from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.billing import Order, Plan
from app.models.content import Level
from app.models.enums import OrderStatus
from app.models.user import User


def _register_and_get_token(
    client: TestClient, email: str, is_staff: bool = False, db_session: Session | None = None
) -> str:
    payload = {
        "email": email,
        "password": "password123",
        "display_name": "Admin User" if is_staff else "Regular User",
    }
    res = client.post("/api/v1/auth/register", json=payload)
    assert res.status_code == 201, res.text
    token = res.json()["access_token"]

    if is_staff and db_session is not None:
        user = db_session.scalar(select(User).where(User.email == email))
        assert user is not None
        user.is_staff = True
        db_session.commit()
        db_session.refresh(user)

    return token


def test_admin_endpoints_require_staff(client: TestClient) -> None:
    # 1. No token -> 403 (FastAPI raises 403 automatically for missing HTTPBearer credentials)
    res = client.get("/api/v1/admin/overview")
    assert res.status_code == 403

    # 2. Regular user token -> 403 (does not have enough privileges)
    reg_token = _register_and_get_token(client, "regular@example.com")
    res = client.get("/api/v1/admin/overview", headers={"Authorization": f"Bearer {reg_token}"})
    assert res.status_code == 403


def test_admin_overview(client: TestClient, db_session: Session) -> None:
    admin_token = _register_and_get_token(
        client, "admin@example.com", is_staff=True, db_session=db_session
    )

    res = client.get("/api/v1/admin/overview", headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 200
    body = res.json()
    assert "total_users" in body
    assert "vip_users" in body
    assert "total_questions" in body
    assert "total_mock_tests" in body
    assert "total_articles" in body
    assert "total_orders" in body
    assert "total_revenue" in body


def test_admin_user_and_order_management(client: TestClient, db_session: Session) -> None:
    admin_token = _register_and_get_token(
        client, "admin2@example.com", is_staff=True, db_session=db_session
    )

    # List users
    res = client.get("/api/v1/admin/users", headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 200
    users = res.json()
    assert len(users) >= 1

    # Update user (grant VIP)
    user_id = users[0]["id"]
    res = client.put(
        f"/api/v1/admin/users/{user_id}",
        json={"vip_until": "2029-12-31T23:59:59Z"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 200
    assert res.json()["vip_until"].startswith("2029")

    # Create a Plan and Order to test order listing & refund
    plan = Plan(
        name="Monthly Premium",
        interval="month",
        duration_days=30,
        price=9.99,
        currency="USD",
        is_active=True,
    )
    db_session.add(plan)
    db_session.commit()
    db_session.refresh(plan)

    order = Order(
        user_id=user_id,
        plan_id=plan.id,
        status=OrderStatus.pending,
        amount=9.99,
        currency="USD",
        gateway="paypal",
    )
    db_session.add(order)
    db_session.commit()
    db_session.refresh(order)

    # List orders
    res = client.get("/api/v1/admin/orders", headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 200
    orders = res.json()
    assert len(orders) == 1
    assert orders[0]["id"] == order.id

    # Refund order
    res = client.post(
        f"/api/v1/admin/orders/{order.id}/refund",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 200
    assert res.json()["status"] == "refunded"


def test_admin_content_crud_and_import(client: TestClient, db_session: Session) -> None:
    admin_token = _register_and_get_token(
        client, "admin3@example.com", is_staff=True, db_session=db_session
    )

    # 1. Level CRUD
    res = client.post(
        "/api/v1/admin/levels",
        json={"code": "HSK9", "name": "HSK Level 9", "order": 9},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 201
    level_id = res.json()["id"]

    # Update Level
    res = client.put(
        f"/api/v1/admin/levels/{level_id}",
        json={"name": "HSK Advanced 7-9"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 200
    assert res.json()["name"] == "HSK Advanced 7-9"

    # 2. Skill CRUD
    res = client.post(
        "/api/v1/admin/skills",
        json={"level_id": level_id, "type": "reading", "name": "Advanced Reading", "order": 2},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 201
    skill_id = res.json()["id"]

    # 3. Section CRUD
    res = client.post(
        "/api/v1/admin/sections",
        json={
            "skill_id": skill_id,
            "title": "Advanced Match",
            "question_type": "match_picture",
            "order": 1,
            "is_free": False,
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 201
    section_id = res.json()["id"]

    # 4. Question & Option CRUD
    res = client.post(
        "/api/v1/admin/questions",
        json={
            "section_id": section_id,
            "stem": "Who is the president?",
            "difficulty": 3,
            "options": [
                {"label": "A", "content": "Correct choice", "is_correct": True},
                {"label": "B", "content": "Wrong choice", "is_correct": False},
            ],
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 201
    q_body = res.json()
    assert len(q_body["options"]) == 2
    assert q_body["options"][0]["is_correct"] is True

    # 5. Bulk Import Questions
    import_payload = {
        "section_id": section_id,
        "questions": [
            {
                "stem": "Imported Q1",
                "difficulty": 2,
                "options": [
                    {"label": "A", "content": "Correct Opt", "is_correct": True},
                    {"label": "B", "content": "Incorrect Opt", "is_correct": False},
                ],
            },
            {
                "stem": "Imported Q2",
                "difficulty": 1,
                "options": [
                    {"label": "A", "content": "Opt A", "is_correct": False},
                    {"label": "B", "content": "Opt B", "is_correct": True},
                ],
            },
        ],
    }
    res = client.post(
        "/api/v1/admin/questions/import",
        json=import_payload,
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 200
    assert res.json()["imported_count"] == 2


def test_admin_mock_tests_and_articles_crud(client: TestClient, db_session: Session) -> None:
    admin_token = _register_and_get_token(
        client, "admin4@example.com", is_staff=True, db_session=db_session
    )

    # Prepare Level
    level = Level(code="HSK8", name="HSK Level 8", order=8)
    db_session.add(level)
    db_session.commit()
    db_session.refresh(level)

    # 1. MockTest CRUD
    res = client.post(
        "/api/v1/admin/mock-tests",
        json={
            "level_id": level.id,
            "title": "Mock HSK 8 Standard",
            "duration_sec": 3600,
            "structure": {"listening": 20, "reading": 20},
            "is_free": False,
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 201
    mock_id = res.json()["id"]

    # List MockTests
    res = client.get("/api/v1/admin/mock-tests", headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 200
    assert len(res.json()) >= 1

    # 2. Article CRUD
    res = client.post(
        "/api/v1/admin/articles",
        json={
            "slug": "how-to-pass-hsk6",
            "title": "Unlocking HSK 6 in 60 Days",
            "body": "Article content goes here...",
            "lang": "en",
            "is_sample": False,
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 201
    art_id = res.json()["id"]

    # Update Article
    res = client.put(
        f"/api/v1/admin/articles/{art_id}",
        json={"title": "Mastering HSK 6 in 60 Days"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 200
    assert res.json()["title"] == "Mastering HSK 6 in 60 Days"

    # Delete MockTest
    res = client.delete(
        f"/api/v1/admin/mock-tests/{mock_id}", headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert res.status_code == 204


def test_admin_settings_set_and_mask_gemini_key(
    client: TestClient, db_session: Session
) -> None:
    admin_token = _register_and_get_token(
        client, "settings-admin@example.com", is_staff=True, db_session=db_session
    )
    headers = {"Authorization": f"Bearer {admin_token}"}

    # Initially no DB key -> not set, AI disabled (no env key in tests).
    res = client.get("/api/v1/admin/settings", headers=headers)
    assert res.status_code == 200, res.text
    assert res.json()["gemini_key_set"] is False

    # Set a key -> stored, masked, AI enabled, never returned verbatim.
    res = client.put(
        "/api/v1/admin/settings",
        headers=headers,
        json={"gemini_api_key": "secret-key-abcd1234"},
    )
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["gemini_key_set"] is True
    assert body["ai_enabled"] is True
    assert body["gemini_key_masked"].endswith("1234")
    assert "secret-key" not in body["gemini_key_masked"]

    # Clearing with empty string disables it again.
    res = client.put(
        "/api/v1/admin/settings", headers=headers, json={"gemini_api_key": ""}
    )
    assert res.status_code == 200
    assert res.json()["gemini_key_set"] is False


def test_admin_settings_requires_staff(client: TestClient) -> None:
    reg_token = _register_and_get_token(client, "settings-regular@example.com")
    res = client.get(
        "/api/v1/admin/settings", headers={"Authorization": f"Bearer {reg_token}"}
    )
    assert res.status_code == 403
