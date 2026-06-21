from __future__ import annotations

from datetime import UTC, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload, selectinload

from app.models.content import Level, Question, Section
from app.models.enums import SkillType
from app.models.mock import MockAttempt, MockTest
from app.models.user import User
from app.schemas.mock import MockResultOut
from app.schemas.practice import AnswerIn, QuestionResult
from app.services.practice import (
    SELF_ASSESSED_TYPES,
    TEXT_TYPES,
    _correct_option,
    _normalize,
)

PASS_THRESHOLD = 60


def list_for_level(db: Session, level_code: str) -> list[MockTest]:
    level = db.scalar(select(Level).where(Level.code == level_code))
    if level is None:
        return []
    return list(
        db.scalars(select(MockTest).where(MockTest.level_id == level.id)).all()
    )


def get_mock_test(db: Session, mock_test_id: int) -> MockTest | None:
    return db.get(MockTest, mock_test_id)


def question_ids(mock_test: MockTest) -> list[int]:
    raw = mock_test.structure.get("question_ids", []) if mock_test.structure else []
    return [int(qid) for qid in raw]


def load_questions(db: Session, ids: list[int]) -> list[Question]:
    if not ids:
        return []
    rows = db.scalars(
        select(Question)
        .where(Question.id.in_(ids))
        .options(
            selectinload(Question.options),
            joinedload(Question.section).joinedload(Section.skill),
        )
    ).all()
    by_id = {q.id: q for q in rows}
    # Preserve the order defined by the mock test structure.
    return [by_id[qid] for qid in ids if qid in by_id]


def _percent(correct: int, total: int) -> int:
    return round(correct / total * 100) if total else 0


def grade_mock(
    db: Session,
    mock_test: MockTest,
    answers: list[AnswerIn],
    user: User | None,
    duration_sec: int | None,
) -> MockResultOut:
    questions = {q.id: q for q in load_questions(db, question_ids(mock_test))}
    results: list[QuestionResult] = []

    # skill_type -> [correct, total]
    by_skill: dict[SkillType, list[int]] = {}
    total_correct = 0
    total_graded = 0

    for answer in answers:
        question = questions.get(answer.question_id)
        if question is None:
            continue
        qtype = question.section.question_type
        skill_type = question.section.skill.type

        if qtype in SELF_ASSESSED_TYPES:
            results.append(
                QuestionResult(
                    question_id=question.id,
                    is_correct=False,
                    graded=False,
                    explanation=question.explanation,
                    translation=question.translation,
                )
            )
            continue

        correct = _correct_option(question)
        if qtype in TEXT_TYPES:
            is_correct = bool(
                answer.text_answer
                and correct is not None
                and _normalize(answer.text_answer) == _normalize(correct.content)
            )
            results.append(
                QuestionResult(
                    question_id=question.id,
                    is_correct=is_correct,
                    correct_answer=correct.content if correct else None,
                    explanation=question.explanation,
                    translation=question.translation,
                )
            )
        else:
            is_correct = (
                answer.chosen_option_id is not None
                and correct is not None
                and answer.chosen_option_id == correct.id
            )
            results.append(
                QuestionResult(
                    question_id=question.id,
                    is_correct=is_correct,
                    correct_option_id=correct.id if correct else None,
                    explanation=question.explanation,
                    translation=question.translation,
                )
            )

        bucket = by_skill.setdefault(skill_type, [0, 0])
        bucket[1] += 1
        total_graded += 1
        if is_correct:
            bucket[0] += 1
            total_correct += 1

    listening = by_skill.get(SkillType.listening, [0, 0])
    reading = by_skill.get(SkillType.reading, [0, 0])
    writing = by_skill.get(SkillType.writing, [0, 0])
    speaking = by_skill.get(SkillType.speaking, [0, 0])

    overall = _percent(total_correct, total_graded)
    attempt_id: int | None = None

    if user is not None:
        now = datetime.now(UTC)
        started = (
            now - timedelta(seconds=duration_sec)
            if duration_sec is not None
            else now
        )
        attempt = MockAttempt(
            user_id=user.id,
            mock_test_id=mock_test.id,
            score=overall,
            listening_score=_percent(*listening),
            reading_score=_percent(*reading),
            writing_score=_percent(*writing),
            started_at=started,
            finished_at=now,
        )
        db.add(attempt)
        db.commit()
        db.refresh(attempt)
        attempt_id = attempt.id
        from app.services import gamification as gam

        gam.award_for_mock(db, user, passed=overall >= PASS_THRESHOLD)

    return MockResultOut(
        attempt_id=attempt_id,
        score=overall,
        listening_score=_percent(*listening),
        reading_score=_percent(*reading),
        writing_score=_percent(*writing),
        speaking_score=_percent(*speaking),
        total_questions=total_graded,
        correct=total_correct,
        passed=overall >= PASS_THRESHOLD,
        results=results,
    )


def list_attempts(db: Session, user: User) -> list[MockAttempt]:
    return list(
        db.scalars(
            select(MockAttempt)
            .where(MockAttempt.user_id == user.id)
            .order_by(MockAttempt.id.desc())
        ).all()
    )
