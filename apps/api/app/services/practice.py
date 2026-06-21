from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload, selectinload

from app.models.content import Option, Question
from app.models.enums import QuestionType
from app.models.practice import Attempt, Progress
from app.models.user import User
from app.schemas.practice import AnswerIn, GradeOut, QuestionResult

# Question types that are scored as free text rather than option choice.
TEXT_TYPES = {QuestionType.fill_blank}
# Question types that are not auto-graded (learner self-assesses).
SELF_ASSESSED_TYPES = {QuestionType.writing_task, QuestionType.speaking_task}


def _correct_option(question: Question) -> Option | None:
    return next((o for o in question.options if o.is_correct), None)


def _normalize(text: str) -> str:
    return " ".join(text.lower().split())


def grade_answers(db: Session, answers: list[AnswerIn], user: User | None) -> GradeOut:
    question_ids = [a.question_id for a in answers]
    questions = db.scalars(
        select(Question)
        .where(Question.id.in_(question_ids))
        .options(
            selectinload(Question.options),
            joinedload(Question.section),
        )
    ).all()
    qmap = {q.id: q for q in questions}

    results: list[QuestionResult] = []
    correct_count = 0
    graded_total = 0
    # section_id -> [answered_delta, correct_delta]
    section_delta: dict[int, list[int]] = {}

    for answer in answers:
        question = qmap.get(answer.question_id)
        if question is None:
            continue
        qtype = question.section.question_type

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
            result = QuestionResult(
                question_id=question.id,
                is_correct=is_correct,
                correct_answer=correct.content if correct else None,
                explanation=question.explanation,
                translation=question.translation,
            )
        else:
            is_correct = (
                answer.chosen_option_id is not None
                and correct is not None
                and answer.chosen_option_id == correct.id
            )
            result = QuestionResult(
                question_id=question.id,
                is_correct=is_correct,
                correct_option_id=correct.id if correct else None,
                explanation=question.explanation,
                translation=question.translation,
            )

        results.append(result)
        graded_total += 1
        if is_correct:
            correct_count += 1

        if user is not None:
            db.add(
                Attempt(
                    user_id=user.id,
                    question_id=question.id,
                    chosen_option_id=answer.chosen_option_id,
                    is_correct=is_correct,
                )
            )
            delta = section_delta.setdefault(question.section_id, [0, 0])
            delta[0] += 1
            delta[1] += 1 if is_correct else 0

    if user is not None and section_delta:
        for section_id, (answered, correct_n) in section_delta.items():
            progress = db.scalar(
                select(Progress).where(
                    Progress.user_id == user.id,
                    Progress.section_id == section_id,
                )
            )
            if progress is None:
                progress = Progress(
                    user_id=user.id, section_id=section_id, answered=0, correct=0
                )
                db.add(progress)
            progress.answered += answered
            progress.correct += correct_n
        db.commit()

    return GradeOut(total=graded_total, correct=correct_count, results=results)


def list_progress(db: Session, user: User) -> list[Progress]:
    stmt = select(Progress).where(Progress.user_id == user.id)
    return list(db.scalars(stmt).all())
