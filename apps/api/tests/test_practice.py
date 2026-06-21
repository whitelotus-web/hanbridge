import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.content import Level, Option, Question, Section, Skill
from app.models.enums import QuestionType, SkillType


@pytest.fixture
def section(db_session: Session) -> Section:
    level = Level(code="TSTLVL", name="Test Level", order=1)
    skill = Skill(level=level, type=SkillType.listening, name="Listening", order=1)
    sec = Section(
        skill=skill,
        title="True or false",
        question_type=QuestionType.multiple_choice,
        order=1,
    )
    q = Question(section=sec, stem="你好?", difficulty=1, is_sample=True)
    q.options = [
        Option(label="A", content="Hello", is_correct=True),
        Option(label="B", content="Bye", is_correct=False),
    ]
    db_session.add(level)
    db_session.flush()
    return sec


def _register(client: TestClient) -> str:
    res = client.post(
        "/api/v1/auth/register",
        json={"email": "learner@example.com", "password": "supersecret123"},
    )
    return res.json()["access_token"]


def test_get_section_hides_correct_answer(
    client: TestClient, section: Section
) -> None:
    res = client.get(f"/api/v1/sections/{section.id}")
    assert res.status_code == 200
    body = res.json()
    assert body["level_code"] == "TSTLVL"
    option = body["questions"][0]["options"][0]
    assert "is_correct" not in option


def test_get_section_not_found(client: TestClient) -> None:
    assert client.get("/api/v1/sections/999999").status_code == 404


def test_grade_anonymous(client: TestClient, section: Section) -> None:
    q = section.questions[0]
    correct_id = next(o.id for o in q.options if o.is_correct)
    wrong_id = next(o.id for o in q.options if not o.is_correct)

    res = client.post(
        "/api/v1/practice/grade",
        json={
            "answers": [
                {"question_id": q.id, "chosen_option_id": correct_id},
            ]
        },
    )
    assert res.status_code == 200
    body = res.json()
    assert body["total"] == 1 and body["correct"] == 1
    assert body["results"][0]["correct_option_id"] == correct_id

    res2 = client.post(
        "/api/v1/practice/grade",
        json={"answers": [{"question_id": q.id, "chosen_option_id": wrong_id}]},
    )
    assert res2.json()["correct"] == 0


def test_grade_records_progress_for_member(
    client: TestClient, section: Section
) -> None:
    token = _register(client)
    q = section.questions[0]
    correct_id = next(o.id for o in q.options if o.is_correct)

    client.post(
        "/api/v1/practice/grade",
        headers={"Authorization": f"Bearer {token}"},
        json={"answers": [{"question_id": q.id, "chosen_option_id": correct_id}]},
    )

    progress = client.get(
        "/api/v1/me/progress", headers={"Authorization": f"Bearer {token}"}
    )
    assert progress.status_code == 200
    rows = progress.json()
    assert len(rows) == 1
    assert rows[0]["answered"] == 1 and rows[0]["correct"] == 1


def test_progress_requires_auth(client: TestClient) -> None:
    assert client.get("/api/v1/me/progress").status_code == 403


@pytest.fixture
def fill_section(db_session: Session) -> Section:
    level = Level(code="TSTFILL", name="Test Fill", order=1)
    skill = Skill(level=level, type=SkillType.reading, name="Reading", order=1)
    sec = Section(
        skill=skill,
        title="Fill in the blank",
        question_type=QuestionType.fill_blank,
        order=1,
    )
    q = Question(section=sec, stem="我＿＿学生。", difficulty=1, is_sample=True)
    q.options = [Option(label="A", content="是", is_correct=True)]
    db_session.add(level)
    db_session.flush()
    return sec


def test_grade_fill_blank_text(client: TestClient, fill_section: Section) -> None:
    q = fill_section.questions[0]
    ok = client.post(
        "/api/v1/practice/grade",
        json={"answers": [{"question_id": q.id, "text_answer": " 是 "}]},
    ).json()
    assert ok["correct"] == 1
    assert ok["results"][0]["correct_answer"] == "是"

    bad = client.post(
        "/api/v1/practice/grade",
        json={"answers": [{"question_id": q.id, "text_answer": "不"}]},
    ).json()
    assert bad["correct"] == 0


@pytest.fixture
def writing_section(db_session: Session) -> Section:
    level = Level(code="TSTWRITE", name="Test Write", order=1)
    skill = Skill(level=level, type=SkillType.writing, name="Writing", order=1)
    sec = Section(
        skill=skill,
        title="Write a sentence",
        question_type=QuestionType.writing_task,
        order=1,
    )
    Question(
        section=sec,
        stem="Introduce yourself.",
        explanation="Model answer: 我叫小明。",
        difficulty=1,
        is_sample=True,
    )
    db_session.add(level)
    db_session.flush()
    return sec


def test_writing_task_is_self_assessed(
    client: TestClient, writing_section: Section
) -> None:
    q = writing_section.questions[0]
    res = client.post(
        "/api/v1/practice/grade",
        json={"answers": [{"question_id": q.id, "text_answer": "我叫A。"}]},
    ).json()
    # Self-assessed tasks are excluded from the score and flagged ungraded.
    assert res["total"] == 0
    assert res["results"][0]["graded"] is False
    assert "Model answer" in res["results"][0]["explanation"]
