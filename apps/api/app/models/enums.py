import enum


class SkillType(str, enum.Enum):
    listening = "listening"
    reading = "reading"
    writing = "writing"
    speaking = "speaking"  # HSKK
    test = "test"


class QuestionType(str, enum.Enum):
    true_false = "true_false"
    match_picture = "match_picture"
    match_dialogue = "match_dialogue"
    multiple_choice = "multiple_choice"
    fill_blank = "fill_blank"
    sentence_order = "sentence_order"
    writing_task = "writing_task"
    speaking_task = "speaking_task"


class PlanInterval(str, enum.Enum):
    month = "month"
    quarter = "quarter"
    half_year = "half_year"
    year = "year"
    lifetime = "lifetime"


class OrderStatus(str, enum.Enum):
    pending = "pending"
    paid = "paid"
    failed = "failed"
    refunded = "refunded"
