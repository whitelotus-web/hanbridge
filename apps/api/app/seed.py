"""Seed the database with SAMPLE content (HSK structure + a few questions).

Everything inserted here is flagged ``is_sample=True`` so it can be located and
replaced with real licensed content later. Run with::

    uv run python -m app.seed
"""

from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy import select

from app.db.session import SessionLocal
from app.models.article import Article
from app.models.billing import Plan
from app.models.content import Level, Option, Question, Section, Skill
from app.models.enums import PlanInterval, QuestionType, SkillType

# HSK 1-6 plus the advanced 7-9 band.
LEVELS: list[tuple[str, str, int]] = [
    ("HSK1", "HSK Level 1", 1),
    ("HSK2", "HSK Level 2", 2),
    ("HSK3", "HSK Level 3", 3),
    ("HSK4", "HSK Level 4", 4),
    ("HSK5", "HSK Level 5", 5),
    ("HSK6", "HSK Level 6", 6),
    ("HSK7-9", "HSK 7-9 (Advanced)", 7),
]

# Listening sections that mirror the real HSK1 layout.
HSK1_LISTENING_SECTIONS: list[tuple[str, QuestionType, int]] = [
    ("True or false", QuestionType.true_false, 1),
    ("Match sentences with pictures", QuestionType.match_picture, 2),
    ("Match dialogues with pictures", QuestionType.match_dialogue, 3),
    ("Choose the right answer", QuestionType.multiple_choice, 4),
]


def _sample_question(section: Section) -> Question:
    q = Question(
        section=section,
        stem="[SAMPLE] 你好！— What does this greeting mean?",
        explanation="[SAMPLE] 你好 (nǐ hǎo) is the most common way to say hello.",
        translation="Hello!",
        difficulty=1,
        is_sample=True,
    )
    q.options = [
        Option(label="A", content="Hello", is_correct=True),
        Option(label="B", content="Goodbye", is_correct=False),
        Option(label="C", content="Thank you", is_correct=False),
    ]
    return q


def seed() -> None:
    db = SessionLocal()
    try:
        existing = db.scalar(select(Level).limit(1))
        if existing is not None:
            print("Data already present; skipping seed.")
            return

        levels: dict[str, Level] = {}
        for code, name, order in LEVELS:
            lvl = Level(code=code, name=name, order=order)
            db.add(lvl)
            levels[code] = lvl

        # Build a representative HSK1 listening skill with its sections.
        hsk1 = levels["HSK1"]
        listening = Skill(
            level=hsk1, type=SkillType.listening, name="Listening", order=1
        )
        reading = Skill(level=hsk1, type=SkillType.reading, name="Reading", order=2)
        db.add_all([listening, reading])

        for title, qtype, order in HSK1_LISTENING_SECTIONS:
            section = Section(
                skill=listening, title=title, question_type=qtype, order=order
            )
            db.add(section)
            db.add(_sample_question(section))

        # Sample VIP plans (prices are placeholders).
        db.add_all(
            [
                Plan(
                    name="1 Month",
                    interval=PlanInterval.month,
                    duration_days=30,
                    price=14.99,
                    currency="USD",
                ),
                Plan(
                    name="12 Months",
                    interval=PlanInterval.year,
                    duration_days=365,
                    price=69.99,
                    currency="USD",
                ),
                Plan(
                    name="Lifetime",
                    interval=PlanInterval.lifetime,
                    duration_days=None,
                    price=99.99,
                    currency="USD",
                ),
            ]
        )

        db.add(
            Article(
                slug="hsk-exam-dates",
                title="[SAMPLE] HSK exam dates & registration guide",
                body="Replace with a real article.",
                lang="en",
                is_sample=True,
                published_at=datetime.now(UTC),
            )
        )

        db.commit()
        print("Seeded SAMPLE data successfully.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
