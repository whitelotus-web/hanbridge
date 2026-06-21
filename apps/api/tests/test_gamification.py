from __future__ import annotations

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.content import Level, Option, Question, Section, Skill
from app.models.enums import QuestionType, SkillType
from app.models.gamification import Badge


def _register(client: TestClient, email: str) -> str:
    res = client.post(
        "/api/v1/auth/register", json={"email": email, "password": "password123"}
    )
    assert res.status_code == 201, res.text
    return res.json()["access_token"]


def _make_section(db: Session, n: int = 12) -> list[int]:
    level = Level(code="HSK1", name="HSK Level 1", order=1)
    skill = Skill(level=level, type=SkillType.listening, name="Listening", order=1)
    section = Section(
        skill=skill,
        title="MCQ",
        question_type=QuestionType.multiple_choice,
        order=1,
        is_free=True,
    )
    qids: list[int] = []
    for i in range(n):
        q = Question(section=section, stem=f"Q{i}", is_sample=True)
        q.options = [
            Option(label="A", content="right", is_correct=True),
            Option(label="B", content="wrong", is_correct=False),
        ]
        db.add(q)
    db.commit()
    db.refresh(section)
    qids = [q.id for q in section.questions]
    return qids


def test_gamification_requires_auth(client: TestClient) -> None:
    assert client.get("/api/v1/me/gamification").status_code == 403


def test_xp_streak_and_badges(client: TestClient, db_session: Session) -> None:
    # Seed a couple of badges that should be earned.
    db_session.add_all(
        [
            Badge(code="first_steps", name="First Steps", description="10 questions",
                  icon="🌱", threshold_type="questions", threshold_value=10),
            Badge(code="xp_50", name="Starter", description="50 xp",
                  icon="⭐", threshold_type="xp", threshold_value=50),
        ]
    )
    db_session.commit()

    qids = _make_section(db_session, n=12)
    token = _register(client, "gam@example.com")

    # Answer all 12 correctly via the practice grader (awards XP).
    correct_map = {}
    for qid in qids:
        q = db_session.get(Question, qid)
        correct_map[qid] = next(o.id for o in q.options if o.is_correct)
    answers = [{"question_id": qid, "chosen_option_id": correct_map[qid]} for qid in qids]
    res = client.post(
        "/api/v1/practice/grade",
        json={"answers": answers},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 200, res.text
    assert res.json()["correct"] == 12

    g = client.get(
        "/api/v1/me/gamification", headers={"Authorization": f"Bearer {token}"}
    )
    assert g.status_code == 200, g.text
    body = g.json()
    # 12*2 (answered) + 12*8 (correct) = 120 XP
    assert body["xp"] == 120
    assert body["level"] >= 2
    assert body["streak_days"] == 1
    codes = {b["code"] for b in body["badges"]}
    assert "first_steps" in codes
    assert "xp_50" in codes


def test_leaderboard(client: TestClient, db_session: Session) -> None:
    qids = _make_section(db_session, n=3)
    token = _register(client, "lead@example.com")
    q = db_session.get(Question, qids[0])
    cid = next(o.id for o in q.options if o.is_correct)
    client.post(
        "/api/v1/practice/grade",
        json={"answers": [{"question_id": qids[0], "chosen_option_id": cid}]},
        headers={"Authorization": f"Bearer {token}"},
    )
    lb = client.get(
        "/api/v1/leaderboard", headers={"Authorization": f"Bearer {token}"}
    )
    assert lb.status_code == 200, lb.text
    data = lb.json()
    assert len(data["entries"]) >= 1
    assert data["entries"][0]["rank"] == 1
    assert data["my_rank"] is not None
