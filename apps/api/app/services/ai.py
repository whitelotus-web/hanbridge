"""AI tutor powered by Google Gemini, with a deterministic dev fallback.

When ``GEMINI_API_KEY`` is set the service calls Gemini; otherwise (local dev,
CI, or any provider error) it falls back to deterministic, content-derived text
so the product keeps working and tests stay hermetic. Every public function
returns ``(text, ai_generated)`` semantics via the schema's ``ai_generated``
flag so the UI can label AI vs. fallback output.
"""

from __future__ import annotations

import logging

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload, selectinload

from app.models.content import Option, Question
from app.models.enums import QuestionType
from app.models.practice import Progress
from app.models.tutor import TutorMessage
from app.models.user import User
from app.schemas.ai import (
    ExplainOut,
    StudyPlanItem,
    StudyPlanOut,
    TutorChatOut,
    TutorMessageOut,
)
from app.services import settings as settings_service

logger = logging.getLogger(__name__)

# Question types graded as free text vs. not auto-graded.
TEXT_TYPES = {QuestionType.fill_blank}
SELF_ASSESSED_TYPES = {QuestionType.writing_task, QuestionType.speaking_task}

_MODEL_NAME = "gemini-2.0-flash"
# Keep the last N turns as context for follow-up questions.
HISTORY_LIMIT = 12


def ai_enabled(db: Session) -> bool:
    return bool(settings_service.get_gemini_key(db))


def _generate(db: Session, prompt: str, system: str | None = None) -> str | None:
    """Call Gemini; return None on any failure so callers can fall back."""
    api_key = settings_service.get_gemini_key(db)
    if not api_key:
        return None
    try:
        import google.generativeai as genai  # lazy: optional dependency

        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(
            _MODEL_NAME, system_instruction=system
        )
        response = model.generate_content(prompt)
        text = (getattr(response, "text", "") or "").strip()
        return text or None
    except Exception:  # noqa: BLE001 - never let AI errors break the request
        logger.exception("Gemini generation failed; using fallback")
        return None


def _correct_option(question: Question) -> Option | None:
    return next((o for o in question.options if o.is_correct), None)


def _tutor_system(locale: str) -> str:
    return (
        "You are HanBridge Tutor, a friendly, encouraging Chinese-language "
        "(HSK) teacher. Explain clearly and concisely, include pinyin for "
        "Chinese characters, and give short examples. "
        f"Reply in the user's language (locale code: {locale})."
    )


# --------------------------------------------------------------------------- #
# Explain a question's answer
# --------------------------------------------------------------------------- #
def explain_question(
    db: Session,
    *,
    question_id: int,
    chosen_option_id: int | None,
    text_answer: str | None,
    locale: str,
) -> ExplainOut | None:
    question = db.scalars(
        select(Question)
        .where(Question.id == question_id)
        .options(selectinload(Question.options), joinedload(Question.section))
    ).first()
    if question is None:
        return None

    qtype = question.section.question_type
    correct = _correct_option(question)

    is_correct: bool | None
    correct_answer: str | None = None
    if qtype in SELF_ASSESSED_TYPES:
        is_correct = None
    elif qtype in TEXT_TYPES:
        correct_answer = correct.content if correct else None
        is_correct = bool(
            text_answer
            and correct is not None
            and " ".join(text_answer.lower().split())
            == " ".join(correct.content.lower().split())
        )
    else:
        correct_answer = correct.content if correct else None
        is_correct = (
            chosen_option_id is not None
            and correct is not None
            and chosen_option_id == correct.id
        )

    options_text = "; ".join(
        f"{o.label}) {o.content}{' [correct]' if o.is_correct else ''}"
        for o in question.options
    )
    if is_correct is None:
        verdict = "self-assessed"
    elif is_correct:
        verdict = "correct"
    else:
        verdict = "incorrect"
    prompt = (
        f"HSK question: {question.stem}\n"
        f"Options: {options_text or 'n/a'}\n"
        f"Correct answer: {correct_answer or 'see model answer'}\n"
        f"Learner was {verdict}.\n"
        "Explain why the correct answer is right, what the learner may have "
        "confused, and one relevant grammar/vocabulary tip. Keep it under 120 words."
    )
    ai_text = _generate(db, prompt, system=_tutor_system(locale))

    if ai_text:
        return ExplainOut(
            explanation=ai_text,
            is_correct=is_correct,
            correct_answer=correct_answer,
            ai_generated=True,
        )

    # Deterministic fallback from stored content.
    parts: list[str] = []
    if question.explanation:
        parts.append(question.explanation)
    if question.translation:
        parts.append(f"Translation: {question.translation}")
    if correct_answer:
        parts.append(f"Correct answer: {correct_answer}")
    fallback = " ".join(parts) or "No explanation is available for this question yet."
    return ExplainOut(
        explanation=fallback,
        is_correct=is_correct,
        correct_answer=correct_answer,
        ai_generated=False,
    )


# --------------------------------------------------------------------------- #
# Conversational tutor
# --------------------------------------------------------------------------- #
def _recent_history(db: Session, user: User) -> list[TutorMessage]:
    rows = db.scalars(
        select(TutorMessage)
        .where(TutorMessage.user_id == user.id)
        .order_by(TutorMessage.id.desc())
        .limit(HISTORY_LIMIT)
    ).all()
    return list(reversed(rows))


def tutor_chat(db: Session, user: User, message: str, locale: str) -> TutorChatOut:
    history = _recent_history(db, user)
    transcript = "\n".join(f"{m.role}: {m.content}" for m in history)
    prompt = (
        (f"Conversation so far:\n{transcript}\n\n" if transcript else "")
        + f"user: {message}\nassistant:"
    )
    reply = _generate(db, prompt, system=_tutor_system(locale))
    ai_generated = reply is not None
    if not reply:
        reply = (
            "I'm in offline practice mode right now, but I'm happy to help! "
            "Try asking about a specific HSK grammar point, character, or "
            "sentence and I'll explain it when the AI tutor is connected."
        )

    db.add(TutorMessage(user_id=user.id, role="user", content=message))
    db.add(TutorMessage(user_id=user.id, role="assistant", content=reply))
    db.commit()
    return TutorChatOut(reply=reply, ai_generated=ai_generated)


def tutor_history(db: Session, user: User) -> list[TutorMessageOut]:
    rows = db.scalars(
        select(TutorMessage)
        .where(TutorMessage.user_id == user.id)
        .order_by(TutorMessage.id)
    ).all()
    return [TutorMessageOut.model_validate(r) for r in rows]


# --------------------------------------------------------------------------- #
# Personalised study plan
# --------------------------------------------------------------------------- #
def study_plan(db: Session, user: User, locale: str) -> StudyPlanOut:
    from app.models.content import Section, Skill  # local import avoids cycle

    rows = db.scalars(
        select(Progress).where(Progress.user_id == user.id)
    ).all()

    section_ids = [r.section_id for r in rows]
    sections = {
        s.id: s
        for s in db.scalars(
            select(Section)
            .where(Section.id.in_(section_ids or [0]))
            .options(selectinload(Section.skill).selectinload(Skill.level))
        ).all()
    }

    items: list[StudyPlanItem] = []
    for r in rows:
        if r.answered == 0:
            continue
        accuracy = round(r.correct / r.answered * 100)
        section = sections.get(r.section_id)
        if section is None:
            continue
        if accuracy < 80:
            reason = (
                f"Accuracy {accuracy}% over {r.answered} questions — below the "
                "80% mastery target, worth reviewing."
            )
            items.append(
                StudyPlanItem(
                    section_id=r.section_id,
                    section_title=section.title,
                    level_code=section.skill.level.code,
                    skill_name=section.skill.name,
                    answered=r.answered,
                    accuracy=accuracy,
                    reason=reason,
                )
            )

    # Weakest first.
    items.sort(key=lambda i: i.accuracy)
    items = items[:5]

    if items:
        weak = ", ".join(f"{i.section_title} ({i.accuracy}%)" for i in items)
        base_summary = (
            f"You have {len(items)} section(s) below the 80% mastery target. "
            f"Focus next on: {weak}."
        )
    else:
        base_summary = (
            "Great work — no weak sections detected yet. Keep practicing new "
            "sections and try a timed mock test to stretch yourself."
        )

    prompt = (
        f"A learner's weak HSK sections: "
        f"{[{'section': i.section_title, 'accuracy': i.accuracy} for i in items]}. "
        "Write a short, encouraging 2-3 sentence study recommendation."
    )
    ai_summary = _generate(db, prompt, system=_tutor_system(locale))

    return StudyPlanOut(
        summary=ai_summary or base_summary,
        recommendations=items,
        ai_generated=ai_summary is not None,
    )
