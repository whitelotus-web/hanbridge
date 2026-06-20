import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.billing import Plan
from app.models.content import Level, Option, Question, Section, Skill
from app.models.enums import PlanInterval, QuestionType, SkillType


@pytest.fixture
def plan(db_session: Session) -> Plan:
    p = Plan(
        name="1 Month",
        interval=PlanInterval.month,
        duration_days=30,
        price=14.99,
        currency="USD",
    )
    db_session.add(p)
    db_session.flush()
    return p


@pytest.fixture
def vip_section(db_session: Session) -> Section:
    level = Level(code="VIPLVL", name="VIP Level", order=1)
    skill = Skill(level=level, type=SkillType.reading, name="Reading", order=1)
    sec = Section(
        skill=skill,
        title="VIP only",
        question_type=QuestionType.multiple_choice,
        order=1,
        is_free=False,
    )
    q = Question(section=sec, stem="VIP?", difficulty=1, is_sample=True)
    q.options = [Option(label="A", content="Yes", is_correct=True)]
    db_session.add(level)
    db_session.flush()
    return sec


def _register(client: TestClient) -> str:
    res = client.post(
        "/api/v1/auth/register",
        json={"email": "buyer@example.com", "password": "supersecret123"},
    )
    return res.json()["access_token"]


def test_list_plans_and_gateways(client: TestClient, plan: Plan) -> None:
    plans = client.get("/api/v1/plans").json()
    assert any(p["name"] == "1 Month" for p in plans)
    gateways = client.get("/api/v1/billing/gateways").json()
    assert "paypal" in gateways and "payos" in gateways


def test_vip_section_locked_then_unlocked(
    client: TestClient, plan: Plan, vip_section: Section
) -> None:
    # Anonymous: locked.
    assert client.get(f"/api/v1/sections/{vip_section.id}").status_code == 402

    token = _register(client)
    headers = {"Authorization": f"Bearer {token}"}
    # Logged-in but not VIP: still locked.
    assert (
        client.get(f"/api/v1/sections/{vip_section.id}", headers=headers).status_code
        == 402
    )

    # Subscription starts inactive.
    sub = client.get("/api/v1/me/subscription", headers=headers).json()
    assert sub["is_vip"] is False

    # Checkout via PayOS returns a QR payload + mock checkout URL.
    checkout = client.post(
        "/api/v1/billing/checkout",
        headers=headers,
        json={"plan_id": plan.id, "gateway": "payos"},
    ).json()
    assert checkout["qr_data"]
    assert "order=" in checkout["checkout_url"]

    confirm = client.post(
        "/api/v1/billing/confirm",
        headers=headers,
        json={"order_id": checkout["order_id"]},
    ).json()
    assert confirm["status"] == "paid"

    sub = client.get("/api/v1/me/subscription", headers=headers).json()
    assert sub["is_vip"] is True

    # Now the VIP section is accessible.
    assert (
        client.get(f"/api/v1/sections/{vip_section.id}", headers=headers).status_code
        == 200
    )


def test_checkout_rejects_unknown_gateway(client: TestClient, plan: Plan) -> None:
    token = _register(client)
    res = client.post(
        "/api/v1/billing/checkout",
        headers={"Authorization": f"Bearer {token}"},
        json={"plan_id": plan.id, "gateway": "bitcoin"},
    )
    assert res.status_code == 400
