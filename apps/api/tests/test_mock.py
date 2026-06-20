import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.content import Level, Option, Question, Section, Skill
from app.models.enums import QuestionType, SkillType
from app.models.mock import MockTest


@pytest.fixture
def mock_test(db_session: Session) -> MockTest:
    level = Level(code="MOCKLVL", name="Mock Level", order=1)
    listening = Skill(level=level, type=SkillType.listening, name="Listening", order=1)
    reading = Skill(level=level, type=SkillType.reading, name="Reading", order=2)
    lsec = Section(
        skill=listening,
        title="True or false",
        question_type=QuestionType.true_false,
        order=1,
    )
    rsec = Section(
        skill=reading,
        title="Fill in the blank",
        question_type=QuestionType.fill_blank,
        order=1,
    )
    q1 = Question(section=lsec, stem="你好?", difficulty=1, is_sample=True)
    q1.options = [
        Option(label="A", content="Hello", is_correct=True),
        Option(label="B", content="Bye", is_correct=False),
    ]
    q2 = Question(section=rsec, stem="我＿＿学生。", difficulty=1, is_sample=True)
    q2.options = [Option(label="A", content="是", is_correct=True)]
    db_session.add(level)
    db_session.flush()
    test = MockTest(
        level_id=level.id,
        title="Mock A",
        duration_sec=600,
        structure={"question_ids": [q1.id, q2.id]},
    )
    db_session.add(test)
    db_session.flush()
    return test


def _register(client: TestClient) -> str:
    res = client.post(
        "/api/v1/auth/register",
        json={"email": "mocker@example.com", "password": "supersecret123"},
    )
    return res.json()["access_token"]


def test_list_and_get_mock_test(client: TestClient, mock_test: MockTest) -> None:
    listing = client.get("/api/v1/levels/MOCKLVL/mock-tests").json()
    assert len(listing) == 1
    assert listing[0]["question_count"] == 2

    detail = client.get(f"/api/v1/mock-tests/{mock_test.id}").json()
    assert detail["duration_sec"] == 600
    assert len(detail["questions"]) == 2
    # Correct answers are never exposed in the test paper.
    assert all("is_correct" not in o for q in detail["questions"] for o in q["options"])


def test_submit_mock_scores_by_skill(
    client: TestClient, mock_test: MockTest
) -> None:
    detail = client.get(f"/api/v1/mock-tests/{mock_test.id}").json()
    answers = []
    for q in detail["questions"]:
        if q["question_type"] == "fill_blank":
            answers.append({"question_id": q["id"], "text_answer": "是"})
        else:
            correct = q["options"][0]["id"]
            answers.append({"question_id": q["id"], "chosen_option_id": correct})

    res = client.post(
        f"/api/v1/mock-tests/{mock_test.id}/submit",
        json={"answers": answers, "duration_sec": 120},
    ).json()
    assert res["total_questions"] == 2
    assert res["correct"] == 2
    assert res["score"] == 100
    assert res["passed"] is True
    assert res["listening_score"] == 100
    assert res["reading_score"] == 100
    assert res["attempt_id"] is None  # anonymous, not recorded


def test_member_attempt_recorded_and_in_stats(
    client: TestClient, mock_test: MockTest
) -> None:
    token = _register(client)
    headers = {"Authorization": f"Bearer {token}"}
    detail = client.get(f"/api/v1/mock-tests/{mock_test.id}").json()
    answers = [
        {"question_id": q["id"], "chosen_option_id": q["options"][0]["id"]}
        if q["question_type"] != "fill_blank"
        else {"question_id": q["id"], "text_answer": "wrong"}
        for q in detail["questions"]
    ]
    res = client.post(
        f"/api/v1/mock-tests/{mock_test.id}/submit",
        headers=headers,
        json={"answers": answers},
    ).json()
    assert res["attempt_id"] is not None
    assert res["score"] == 50  # one of two correct

    attempts = client.get("/api/v1/me/mock-attempts", headers=headers).json()
    assert len(attempts) == 1
    assert attempts[0]["title"] == "Mock A"

    stats = client.get("/api/v1/me/stats", headers=headers).json()
    # Mock attempts are tracked separately from practice progress.
    assert stats["total_answered"] == 0
    assert len(stats["recent_mocks"]) == 1
    assert stats["recent_mocks"][0]["score"] == 50
