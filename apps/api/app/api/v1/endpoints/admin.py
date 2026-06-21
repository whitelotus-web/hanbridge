from __future__ import annotations

from datetime import UTC, datetime
from decimal import Decimal
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_staff
from app.db.session import get_db
from app.models.article import Article
from app.models.billing import Order, Plan
from app.models.content import Level, Option, Question, Section, Skill
from app.models.enums import OrderStatus
from app.models.mock import MockTest
from app.models.user import User
from app.schemas.admin import (
    AdminOverviewOut,
    AdminUserOut,
    AdminUserUpdate,
    AdminOrderOut,
    LevelCreate,
    LevelUpdate,
    LevelAdminOut,
    SkillCreate,
    SkillUpdate,
    SkillAdminOut,
    SectionCreate,
    SectionUpdate,
    SectionAdminOut,
    QuestionCreate,
    QuestionUpdate,
    QuestionAdminOut,
    OptionCreateInQuestion,
    OptionAdminOut,
    MockTestCreate,
    MockTestUpdate,
    MockTestAdminOut,
    ArticleCreate,
    ArticleUpdate,
    ArticleAdminOut,
    PlanCreate,
    PlanUpdate,
    PlanAdminOut,
    QuestionImportIn,
    QuestionImportOut,
)

router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(get_current_staff)])


@router.get("/overview", response_model=AdminOverviewOut)
def get_overview(db: Session = Depends(get_db)) -> AdminOverviewOut:
    """Fetch global statistics for the admin dashboard."""
    now = datetime.now(UTC)
    
    total_users = db.scalar(select(func.count(User.id))) or 0
    vip_users = db.scalar(select(func.count(User.id)).where(User.vip_until > now)) or 0
    total_questions = db.scalar(select(func.count(Question.id))) or 0
    total_mock_tests = db.scalar(select(func.count(MockTest.id))) or 0
    total_articles = db.scalar(select(func.count(Article.id))) or 0
    total_orders = db.scalar(select(func.count(Order.id))) or 0
    
    revenue_sum = db.scalar(
        select(func.sum(Order.amount)).where(Order.status == OrderStatus.paid)
    )
    total_revenue = Decimal(str(revenue_sum)) if revenue_sum is not None else Decimal("0.00")
    
    return AdminOverviewOut(
        total_users=total_users,
        vip_users=vip_users,
        total_questions=total_questions,
        total_mock_tests=total_mock_tests,
        total_articles=total_articles,
        total_orders=total_orders,
        total_revenue=total_revenue,
    )


# --- User Management ---
@router.get("/users", response_model=list[AdminUserOut])
def list_users(
    offset: int = 0,
    limit: int = 100,
    query: str | None = None,
    is_staff_filter: bool | None = None,
    db: Session = Depends(get_db),
) -> list[User]:
    """List and search users in the system."""
    stmt = select(User)
    if query:
        stmt = stmt.where(User.email.ilike(f"%{query}%") | User.display_name.ilike(f"%{query}%"))
    if is_staff_filter is not None:
        stmt = stmt.where(User.is_staff == is_staff_filter)
    stmt = stmt.order_by(User.id.desc()).offset(offset).limit(limit)
    return list(db.scalars(stmt).all())


@router.get("/users/{user_id}", response_model=AdminUserOut)
def get_user(user_id: int, db: Session = Depends(get_db)) -> User:
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.put("/users/{user_id}", response_model=AdminUserOut)
def update_user(
    user_id: int, payload: AdminUserUpdate, db: Session = Depends(get_db)
) -> User:
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(user, field, value)
    
    db.commit()
    db.refresh(user)
    return user


# --- Order Management ---
@router.get("/orders", response_model=list[AdminOrderOut])
def list_orders(
    offset: int = 0,
    limit: int = 100,
    status_filter: OrderStatus | None = None,
    db: Session = Depends(get_db),
) -> list[Order]:
    stmt = select(Order)
    if status_filter:
        stmt = stmt.where(Order.status == status_filter)
    stmt = stmt.order_by(Order.id.desc()).offset(offset).limit(limit)
    return list(db.scalars(stmt).all())


@router.post("/orders/{order_id}/refund", response_model=AdminOrderOut)
def refund_order(order_id: int, db: Session = Depends(get_db)) -> Order:
    order = db.get(Order, order_id)
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    
    order.status = OrderStatus.refunded
    db.commit()
    db.refresh(order)
    return order


# --- Level CRUD ---
@router.post("/levels", response_model=LevelAdminOut, status_code=status.HTTP_201_CREATED)
def create_level(payload: LevelCreate, db: Session = Depends(get_db)) -> Level:
    # Check if code already exists
    existing = db.scalar(select(Level).where(Level.code == payload.code))
    if existing:
        raise HTTPException(status_code=400, detail=f"Level code '{payload.code}' already exists")
    
    level = Level(**payload.model_dump())
    db.add(level)
    db.commit()
    db.refresh(level)
    return level


@router.get("/levels", response_model=list[LevelAdminOut])
def list_levels(db: Session = Depends(get_db)) -> list[Level]:
    return list(db.scalars(select(Level).order_by(Level.order)).all())


@router.put("/levels/{level_id}", response_model=LevelAdminOut)
def update_level(level_id: int, payload: LevelUpdate, db: Session = Depends(get_db)) -> Level:
    level = db.get(Level, level_id)
    if level is None:
        raise HTTPException(status_code=404, detail="Level not found")
    
    for field, value in payload.model_dump(exclude_unset=True).items():
        if field == "code" and value != level.code:
            existing = db.scalar(select(Level).where(Level.code == value))
            if existing:
                raise HTTPException(status_code=400, detail=f"Level code '{value}' already exists")
        setattr(level, field, value)
        
    db.commit()
    db.refresh(level)
    return level


@router.delete("/levels/{level_id}", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
def delete_level(level_id: int, db: Session = Depends(get_db)) -> Response:
    level = db.get(Level, level_id)
    if level is None:
        raise HTTPException(status_code=404, detail="Level not found")
    db.delete(level)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# --- Skill CRUD ---
@router.post("/skills", response_model=SkillAdminOut, status_code=status.HTTP_201_CREATED)
def create_skill(payload: SkillCreate, db: Session = Depends(get_db)) -> Skill:
    level = db.get(Level, payload.level_id)
    if level is None:
        raise HTTPException(status_code=400, detail="Invalid level_id")
    
    skill = Skill(**payload.model_dump())
    db.add(skill)
    db.commit()
    db.refresh(skill)
    return skill


@router.get("/skills", response_model=list[SkillAdminOut])
def list_skills(level_id: int | None = None, db: Session = Depends(get_db)) -> list[Skill]:
    stmt = select(Skill)
    if level_id is not None:
        stmt = stmt.where(Skill.level_id == level_id)
    return list(db.scalars(stmt.order_by(Skill.order)).all())


@router.put("/skills/{skill_id}", response_model=SkillAdminOut)
def update_skill(skill_id: int, payload: SkillUpdate, db: Session = Depends(get_db)) -> Skill:
    skill = db.get(Skill, skill_id)
    if skill is None:
        raise HTTPException(status_code=404, detail="Skill not found")
    
    for field, value in payload.model_dump(exclude_unset=True).items():
        if field == "level_id" and value is not None:
            level = db.get(Level, value)
            if level is None:
                raise HTTPException(status_code=400, detail="Invalid level_id")
        setattr(skill, field, value)
        
    db.commit()
    db.refresh(skill)
    return skill


@router.delete("/skills/{skill_id}", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
def delete_skill(skill_id: int, db: Session = Depends(get_db)) -> Response:
    skill = db.get(Skill, skill_id)
    if skill is None:
        raise HTTPException(status_code=404, detail="Skill not found")
    db.delete(skill)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# --- Section CRUD ---
@router.post("/sections", response_model=SectionAdminOut, status_code=status.HTTP_201_CREATED)
def create_section(payload: SectionCreate, db: Session = Depends(get_db)) -> Section:
    skill = db.get(Skill, payload.skill_id)
    if skill is None:
        raise HTTPException(status_code=400, detail="Invalid skill_id")
    
    section = Section(**payload.model_dump())
    db.add(section)
    db.commit()
    db.refresh(section)
    return section


@router.get("/sections", response_model=list[SectionAdminOut])
def list_sections(skill_id: int | None = None, db: Session = Depends(get_db)) -> list[Section]:
    stmt = select(Section)
    if skill_id is not None:
        stmt = stmt.where(Section.skill_id == skill_id)
    return list(db.scalars(stmt.order_by(Section.order)).all())


@router.put("/sections/{section_id}", response_model=SectionAdminOut)
def update_section(section_id: int, payload: SectionUpdate, db: Session = Depends(get_db)) -> Section:
    section = db.get(Section, section_id)
    if section is None:
        raise HTTPException(status_code=404, detail="Section not found")
    
    for field, value in payload.model_dump(exclude_unset=True).items():
        if field == "skill_id" and value is not None:
            skill = db.get(Skill, value)
            if skill is None:
                raise HTTPException(status_code=400, detail="Invalid skill_id")
        setattr(section, field, value)
        
    db.commit()
    db.refresh(section)
    return section


@router.delete("/sections/{section_id}", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
def delete_section(section_id: int, db: Session = Depends(get_db)) -> Response:
    section = db.get(Section, section_id)
    if section is None:
        raise HTTPException(status_code=404, detail="Section not found")
    db.delete(section)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# --- Question & Option CRUD ---
@router.post("/questions", response_model=QuestionAdminOut, status_code=status.HTTP_201_CREATED)
def create_question(payload: QuestionCreate, db: Session = Depends(get_db)) -> Question:
    section = db.get(Section, payload.section_id)
    if section is None:
        raise HTTPException(status_code=400, detail="Invalid section_id")
    
    q_data = payload.model_dump(exclude={"options"})
    question = Question(**q_data)
    
    for opt_in in payload.options:
        option = Option(label=opt_in.label, content=opt_in.content, is_correct=opt_in.is_correct)
        question.options.append(option)
        
    db.add(question)
    db.commit()
    db.refresh(question)
    return question


@router.get("/questions", response_model=list[QuestionAdminOut])
def list_questions(
    section_id: int | None = None,
    offset: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
) -> list[Question]:
    stmt = select(Question)
    if section_id is not None:
        stmt = stmt.where(Question.section_id == section_id)
    stmt = stmt.offset(offset).limit(limit)
    return list(db.scalars(stmt).all())


@router.get("/questions/{question_id}", response_model=QuestionAdminOut)
def get_question(question_id: int, db: Session = Depends(get_db)) -> Question:
    question = db.get(Question, question_id)
    if question is None:
        raise HTTPException(status_code=404, detail="Question not found")
    return question


@router.put("/questions/{question_id}", response_model=QuestionAdminOut)
def update_question(
    question_id: int, payload: QuestionUpdate, db: Session = Depends(get_db)
) -> Question:
    question = db.get(Question, question_id)
    if question is None:
        raise HTTPException(status_code=404, detail="Question not found")
    
    q_data = payload.model_dump(exclude_unset=True, exclude={"options"})
    for field, value in q_data.items():
        if field == "section_id" and value is not None:
            section = db.get(Section, value)
            if section is None:
                raise HTTPException(status_code=400, detail="Invalid section_id")
        setattr(question, field, value)
        
    if payload.options is not None:
        # Recreate options completely
        # Delete existing
        for opt in question.options:
            db.delete(opt)
        question.options = []
        for opt_in in payload.options:
            option = Option(label=opt_in.label, content=opt_in.content, is_correct=opt_in.is_correct)
            question.options.append(option)
            
    db.commit()
    db.refresh(question)
    return question


@router.delete("/questions/{question_id}", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
def delete_question(question_id: int, db: Session = Depends(get_db)) -> Response:
    question = db.get(Question, question_id)
    if question is None:
        raise HTTPException(status_code=404, detail="Question not found")
    db.delete(question)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# --- Question Bulk Import ---
@router.post("/questions/import", response_model=QuestionImportOut)
def import_questions(payload: QuestionImportIn, db: Session = Depends(get_db)) -> QuestionImportOut:
    """Bulk import questions with their multiple options into a section."""
    section = db.get(Section, payload.section_id)
    if section is None:
        raise HTTPException(status_code=400, detail="Invalid section_id")
    
    count = 0
    for q_row in payload.questions:
        question = Question(
            section_id=payload.section_id,
            stem=q_row.stem,
            difficulty=q_row.difficulty,
            explanation=q_row.explanation,
            translation=q_row.translation,
            audio_url=q_row.audio_url,
            image_url=q_row.image_url,
            is_sample=False,
        )
        for opt_row in q_row.options:
            option = Option(label=opt_row.label, content=opt_row.content, is_correct=opt_row.is_correct)
            question.options.append(option)
        db.add(question)
        count += 1
        
    db.commit()
    return QuestionImportOut(imported_count=count)


# --- Mock Test CRUD ---
@router.post("/mock-tests", response_model=MockTestAdminOut, status_code=status.HTTP_201_CREATED)
def create_mock_test(payload: MockTestCreate, db: Session = Depends(get_db)) -> MockTest:
    level = db.get(Level, payload.level_id)
    if level is None:
        raise HTTPException(status_code=400, detail="Invalid level_id")
        
    mock = MockTest(**payload.model_dump())
    db.add(mock)
    db.commit()
    db.refresh(mock)
    return mock


@router.get("/mock-tests", response_model=list[MockTestAdminOut])
def list_mock_tests(level_id: int | None = None, db: Session = Depends(get_db)) -> list[MockTest]:
    stmt = select(MockTest)
    if level_id is not None:
        stmt = stmt.where(MockTest.level_id == level_id)
    return list(db.scalars(stmt.order_by(MockTest.id.desc())).all())


@router.put("/mock-tests/{mock_id}", response_model=MockTestAdminOut)
def update_mock_test(
    mock_id: int, payload: MockTestUpdate, db: Session = Depends(get_db)
) -> MockTest:
    mock = db.get(MockTest, mock_id)
    if mock is None:
        raise HTTPException(status_code=404, detail="MockTest not found")
        
    for field, value in payload.model_dump(exclude_unset=True).items():
        if field == "level_id" and value is not None:
            level = db.get(Level, value)
            if level is None:
                raise HTTPException(status_code=400, detail="Invalid level_id")
        setattr(mock, field, value)
        
    db.commit()
    db.refresh(mock)
    return mock


@router.delete("/mock-tests/{mock_id}", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
def delete_mock_test(mock_id: int, db: Session = Depends(get_db)) -> Response:
    mock = db.get(MockTest, mock_id)
    if mock is None:
        raise HTTPException(status_code=404, detail="MockTest not found")
    db.delete(mock)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# --- Article CRUD ---
@router.post("/articles", response_model=ArticleAdminOut, status_code=status.HTTP_201_CREATED)
def create_article(payload: ArticleCreate, db: Session = Depends(get_db)) -> Article:
    existing = db.scalar(select(Article).where(Article.slug == payload.slug))
    if existing:
        raise HTTPException(status_code=400, detail=f"Article slug '{payload.slug}' already exists")
        
    art = Article(**payload.model_dump())
    db.add(art)
    db.commit()
    db.refresh(art)
    return art


@router.get("/articles", response_model=list[ArticleAdminOut])
def list_articles(lang: str | None = None, db: Session = Depends(get_db)) -> list[Article]:
    stmt = select(Article)
    if lang:
        stmt = stmt.where(Article.lang == lang)
    return list(db.scalars(stmt.order_by(Article.id.desc())).all())


@router.get("/articles/{article_id}", response_model=ArticleAdminOut)
def get_article(article_id: int, db: Session = Depends(get_db)) -> Article:
    art = db.get(Article, article_id)
    if art is None:
        raise HTTPException(status_code=404, detail="Article not found")
    return art


@router.put("/articles/{article_id}", response_model=ArticleAdminOut)
def update_article(
    article_id: int, payload: ArticleUpdate, db: Session = Depends(get_db)
) -> Article:
    art = db.get(Article, article_id)
    if art is None:
        raise HTTPException(status_code=404, detail="Article not found")
        
    for field, value in payload.model_dump(exclude_unset=True).items():
        if field == "slug" and value != art.slug:
            existing = db.scalar(select(Article).where(Article.slug == value))
            if existing:
                raise HTTPException(status_code=400, detail=f"Article slug '{value}' already exists")
        setattr(art, field, value)
        
    db.commit()
    db.refresh(art)
    return art


@router.delete("/articles/{article_id}", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
def delete_article(article_id: int, db: Session = Depends(get_db)) -> Response:
    art = db.get(Article, article_id)
    if art is None:
        raise HTTPException(status_code=404, detail="Article not found")
    db.delete(art)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# --- Plan CRUD ---
@router.post("/plans", response_model=PlanAdminOut, status_code=status.HTTP_201_CREATED)
def create_plan(payload: PlanCreate, db: Session = Depends(get_db)) -> Plan:
    plan = Plan(**payload.model_dump())
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan


@router.get("/plans", response_model=list[PlanAdminOut])
def list_plans_admin(db: Session = Depends(get_db)) -> list[Plan]:
    return list(db.scalars(select(Plan).order_by(Plan.id)).all())


@router.put("/plans/{plan_id}", response_model=PlanAdminOut)
def update_plan(
    plan_id: int, payload: PlanUpdate, db: Session = Depends(get_db)
) -> Plan:
    plan = db.get(Plan, plan_id)
    if plan is None:
        raise HTTPException(status_code=404, detail="Plan not found")
        
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(plan, field, value)
        
    db.commit()
    db.refresh(plan)
    return plan


@router.delete("/plans/{plan_id}", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
def delete_plan(plan_id: int, db: Session = Depends(get_db)) -> Response:
    plan = db.get(Plan, plan_id)
    if plan is None:
        raise HTTPException(status_code=404, detail="Plan not found")
    db.delete(plan)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
