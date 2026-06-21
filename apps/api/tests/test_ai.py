from __future__ import annotations

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.content import Level, Option, Question, Section, Skill
from app.models.enums import QuestionType, SkillType


def _register(client: TestClient, email: str = "ai@example.com") -> str:
    res = client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "password123"},
    )
    assert res.status_code == 201, res.text
    return res.json()["access_token"]


def _make_question(db: Session) -> int:
    level = Level(code="HSK1", name="HSK Level 1", order=1)
    skill = Skill(level=level, type=SkillType.listening, name="Listening", order=1)
    section = Section(
        skill=skill,
        title="True or false",
        question_type=QuestionType.multiple_choice,
        order=1,
        is_free=True,
    )
    question = Question(
        section=section,
        stem="[SAMPLE] 你好 means?",
        explanation="你好 (nǐ hǎo) is the most common greeting.",
        translation="Hello!",
        is_sample=True,
    )
    question.options = [
        Option(label="A", content="Hello", is_correct=True),
        Option(label="B", content="Goodbye", is_correct=False),
    ]
    db.add(question)
    db.commit()
    db.refresh(question)
    return question.id


def test_ai_status(client: TestClient) -> None:
    res = client.get("/api/v1/ai/status")
    assert res.status_code == 200
    assert "ai_enabled" in res.json()


def test_explain_fallback(client: TestClient, db_session: Session) -> None:
    qid = _make_question(db_session)
    correct = next(
        o for o in db_session.get(Question, qid).options if o.is_correct
    )
    res = client.post(
        "/api/v1/ai/explain",
        json={"question_id": qid, "chosen_option_id": correct.id, "locale": "en"},
    )
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["is_correct"] is True
    assert body["correct_answer"] == "Hello"
    # Without a GEMINI_API_KEY the deterministic fallback is used.
    assert body["ai_generated"] is False
    assert "nǐ hǎo" in body["explanation"] or "greeting" in body["explanation"]


def test_explain_missing_question(client: TestClient) -> None:
    res = client.post("/api/v1/ai/explain", json={"question_id": 999999})
    assert res.status_code == 404


def test_tutor_chat_requires_auth(client: TestClient) -> None:
    res = client.post("/api/v1/ai/tutor/chat", json={"message": "Hi"})
    assert res.status_code == 403  # HTTPBearer auto_error -> 403 without creds


def test_tutor_chat_and_history(client: TestClient) -> None:
    token = _register(client, "chat@example.com")
    res = client.post(
        "/api/v1/ai/tutor/chat",
        json={"message": "How do I use 是?", "locale": "en"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 200, res.text
    assert res.json()["reply"]

    hist = client.get(
        "/api/v1/ai/tutor/history", headers={"Authorization": f"Bearer {token}"}
    )
    assert hist.status_code == 200
    roles = [m["role"] for m in hist.json()]
    assert roles == ["user", "assistant"]


def test_study_plan_requires_auth(client: TestClient) -> None:
    res = client.get("/api/v1/ai/study-plan")
    assert res.status_code == 403


def test_study_plan_empty(client: TestClient) -> None:
    token = _register(client, "plan@example.com")
    res = client.get(
        "/api/v1/ai/study-plan", headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 200, res.text
    body = res.json()
    assert "summary" in body
    assert body["recommendations"] == []
