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


# (stem, translation, explanation, [(label, content, is_correct), ...])
SAMPLE_QUESTIONS: list[tuple[str, str, str, list[tuple[str, str, bool]]]] = [
    (
        "[SAMPLE] 你好！— What does this greeting mean?",
        "Hello!",
        "你好 (nǐ hǎo) is the most common way to say hello.",
        [("A", "Hello", True), ("B", "Goodbye", False), ("C", "Thank you", False)],
    ),
    (
        "[SAMPLE] 谢谢 — What does this word express?",
        "Thank you",
        "谢谢 (xièxie) means 'thank you'.",
        [("A", "Sorry", False), ("B", "Thank you", True), ("C", "Hello", False)],
    ),
    (
        "[SAMPLE] 再见 — When do you say this?",
        "Goodbye",
        "再见 (zàijiàn) literally means 'see you again' — goodbye.",
        [
            ("A", "When leaving", True),
            ("B", "When eating", False),
            ("C", "When sleeping", False),
        ],
    ),
    (
        "[SAMPLE] 一、二、三 — Which numbers are these?",
        "One, two, three",
        "一二三 (yī èr sān) are the numbers 1, 2, 3.",
        [("A", "4, 5, 6", False), ("B", "1, 2, 3", True), ("C", "7, 8, 9", False)],
    ),
]


# (stem, accepted answer, translation, explanation)
FILL_BLANK_QUESTIONS: list[tuple[str, str, str, str]] = [
    (
        "[SAMPLE] 我＿＿北京人。(fill in the verb 'to be')",
        "是",
        "I am a Beijinger.",
        "是 (shì) means 'to be' and links a subject to a noun.",
    ),
    (
        "[SAMPLE] 今天＿＿星期一。(fill in the verb 'to be')",
        "是",
        "Today is Monday.",
        "Use 是 before nouns/dates.",
    ),
    (
        "[SAMPLE] 他有三＿＿书。(fill in the measure word for books)",
        "本",
        "He has three books.",
        "本 (běn) is the measure word for books.",
    ),
]

# (prompt, model answer, translation)
WRITING_TASKS: list[tuple[str, str, str]] = [
    (
        "[SAMPLE] Write a sentence introducing yourself using 我叫…",
        "我叫小明，我是学生。",
        "My name is Xiaoming, I am a student.",
    ),
    (
        "[SAMPLE] Describe today's weather in one sentence.",
        "今天天气很好。",
        "The weather is very nice today.",
    ),
]

# (prompt, model answer, translation)
SPEAKING_TASKS: list[tuple[str, str, str]] = [
    (
        "[SAMPLE] Read aloud: 你好，很高兴认识你。",
        "你好，很高兴认识你。",
        "Hello, nice to meet you.",
    ),
    (
        "[SAMPLE] Answer aloud: 你叫什么名字？",
        "我叫… (say your name).",
        "What is your name?",
    ),
]


def _sample_questions(section: Section) -> list[Question]:
    questions: list[Question] = []
    for stem, translation, explanation, options in SAMPLE_QUESTIONS:
        q = Question(
            section=section,
            stem=stem,
            explanation=f"[SAMPLE] {explanation}",
            translation=translation,
            difficulty=1,
            is_sample=True,
        )
        q.options = [
            Option(label=label, content=content, is_correct=correct)
            for label, content, correct in options
        ]
        questions.append(q)
    return questions


def _fill_blank_questions(section: Section) -> list[Question]:
    questions: list[Question] = []
    for stem, answer, translation, explanation in FILL_BLANK_QUESTIONS:
        q = Question(
            section=section,
            stem=stem,
            explanation=f"[SAMPLE] {explanation}",
            translation=translation,
            difficulty=1,
            is_sample=True,
        )
        # The single correct option stores the accepted text answer.
        q.options = [Option(label="A", content=answer, is_correct=True)]
        questions.append(q)
    return questions


def _open_questions(
    section: Section, tasks: list[tuple[str, str, str]]
) -> list[Question]:
    questions: list[Question] = []
    for prompt, model_answer, translation in tasks:
        questions.append(
            Question(
                section=section,
                stem=prompt,
                explanation=f"[SAMPLE] Model answer: {model_answer}",
                translation=translation,
                difficulty=1,
                is_sample=True,
            )
        )
    return questions


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

        # ---- HSK1: full skill set across question types ----
        hsk1 = levels["HSK1"]
        listening = Skill(
            level=hsk1, type=SkillType.listening, name="Listening", order=1
        )
        reading = Skill(level=hsk1, type=SkillType.reading, name="Reading", order=2)
        writing = Skill(level=hsk1, type=SkillType.writing, name="Writing", order=3)
        speaking = Skill(
            level=hsk1, type=SkillType.speaking, name="Speaking (HSKK)", order=4
        )
        db.add_all([listening, reading, writing, speaking])

        for title, qtype, order in HSK1_LISTENING_SECTIONS:
            section = Section(
                skill=listening, title=title, question_type=qtype, order=order
            )
            db.add(section)
            db.add_all(_sample_questions(section))

        reading_mcq = Section(
            skill=reading,
            title="Choose the right answer",
            question_type=QuestionType.multiple_choice,
            order=1,
        )
        reading_fill = Section(
            skill=reading,
            title="Fill in the blank",
            question_type=QuestionType.fill_blank,
            order=2,
        )
        db.add_all([reading_mcq, reading_fill])
        db.add_all(_sample_questions(reading_mcq))
        db.add_all(_fill_blank_questions(reading_fill))

        writing_section = Section(
            skill=writing,
            title="Write a sentence",
            question_type=QuestionType.writing_task,
            order=1,
        )
        db.add(writing_section)
        db.add_all(_open_questions(writing_section, WRITING_TASKS))

        speaking_section = Section(
            skill=speaking,
            title="Speak aloud",
            question_type=QuestionType.speaking_task,
            order=1,
        )
        db.add(speaking_section)
        db.add_all(_open_questions(speaking_section, SPEAKING_TASKS))

        # ---- HSK2: listening + reading (so multiple levels have content) ----
        hsk2 = levels["HSK2"]
        hsk2_listening = Skill(
            level=hsk2, type=SkillType.listening, name="Listening", order=1
        )
        hsk2_reading = Skill(
            level=hsk2, type=SkillType.reading, name="Reading", order=2
        )
        db.add_all([hsk2_listening, hsk2_reading])

        hsk2_listening_section = Section(
            skill=hsk2_listening,
            title="True or false",
            question_type=QuestionType.true_false,
            order=1,
        )
        hsk2_reading_section = Section(
            skill=hsk2_reading,
            title="Fill in the blank",
            question_type=QuestionType.fill_blank,
            order=1,
        )
        db.add_all([hsk2_listening_section, hsk2_reading_section])
        db.add_all(_sample_questions(hsk2_listening_section))
        db.add_all(_fill_blank_questions(hsk2_reading_section))

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
