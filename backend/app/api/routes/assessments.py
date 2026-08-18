from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.api.dependencies import require_admin
from app.db.session import get_db

from app.models.assessment import Assessment
from app.models.assessment_question import AssessmentQuestion
from app.models.question import Question
from app.models.skill import Skill

from app.schemas.assessment import (
    AssessmentCreate,
    AssessmentResponse,
    AssessmentDetailResponse,
)

from app.schemas.question import QuestionResponse
from app.schemas.assessment_question import (
    AssessmentQuestionCreate,
)


router = APIRouter(
    prefix="/assessments",
    tags=["Assessments"],
)


# ============================================================
# STUDENT - PUBLISHED ASSESSMENTS
# ============================================================

@router.get(
    "",
    response_model=list[AssessmentResponse],
)
def get_assessments(
    db: Session = Depends(get_db),
):
    return db.scalars(
        select(Assessment)
        .where(
            Assessment.is_published.is_(True)
        )
        .order_by(
            Assessment.id.desc()
        )
    ).all()


# ============================================================
# ADMIN - AVAILABLE TOPICS FOR A SKILL
# ============================================================

@router.get(
    "/available-topics/{skill_id}",
)
def get_available_topics(
    skill_id: int,
    db: Session = Depends(get_db),
    _: object = Depends(require_admin),
):
    skill = db.get(
        Skill,
        skill_id,
    )

    if not skill:
        raise HTTPException(
            status_code=404,
            detail="Skill not found",
        )

    topics = db.scalars(
        select(
            Question.topic
        )
        .where(
            Question.skill_id == skill_id,
            Question.is_active.is_(True),
            Question.topic.is_not(None),
        )
        .distinct()
        .order_by(
            Question.topic.asc()
        )
    ).all()

    return [
        topic
        for topic in topics
        if topic
    ]


# ============================================================
# ADMIN - CHECK AVAILABLE QUESTIONS
# ============================================================

@router.get(
    "/available-count",
)
def get_available_question_count(
    skill_id: int,
    topic: str | None = None,
    difficulty: str | None = None,
    db: Session = Depends(get_db),
    _: object = Depends(require_admin),
):
    query = select(
        func.count(Question.id)
    ).where(
        Question.skill_id == skill_id,
        Question.is_active.is_(True),
    )

    if topic:
        query = query.where(
            func.lower(
                Question.topic
            )
            == topic.strip().lower()
        )

    if difficulty and difficulty not in {
        "BEGINNER",
        "MIXED",
    }:
        query = query.where(
            Question.difficulty
            == difficulty.upper()
        )

    count = db.scalar(query) or 0

    return {
        "available_questions": count,
    }


# ============================================================
# STUDENT - GET ASSESSMENT
# ============================================================

@router.get(
    "/{assessment_id}",
    response_model=AssessmentDetailResponse,
)
def get_assessment(
    assessment_id: int,
    db: Session = Depends(get_db),
):
    assessment = db.scalar(
        select(Assessment)
        .options(
            selectinload(
                Assessment.assessment_questions
            )
            .selectinload(
                AssessmentQuestion.question
            )
            .selectinload(
                Question.options
            )
        )
        .where(
            Assessment.id == assessment_id,
            Assessment.is_published.is_(True),
        )
    )

    if not assessment:
        raise HTTPException(
            status_code=404,
            detail="Assessment not found",
        )

    ordered_questions = sorted(
        assessment.assessment_questions,
        key=lambda item: item.question_order,
    )

    questions = []

    for assessment_question in ordered_questions:

        question = assessment_question.question

        if not question:
            continue

        if not question.is_active:
            continue

        questions.append(
            {
                "id": question.id,
                "skill_id": question.skill_id,
                "question_text": question.question_text,
                "difficulty": question.difficulty,
                "marks": question.marks,
                "options": [
                    {
                        "id": option.id,
                        "option_text": option.option_text,
                    }
                    for option in question.options
                ],
            }
        )

    return {
        "id": assessment.id,
        "title": assessment.title,
        "description": assessment.description,
        "assessment_type": assessment.assessment_type,
        "skill_id": assessment.skill_id,
        "topic": assessment.topic,
        "difficulty": assessment.difficulty,
        "question_count": assessment.question_count,
        "duration_minutes": assessment.duration_minutes,
        "passing_percentage": assessment.passing_percentage,
        "max_attempts": assessment.max_attempts,
        "is_published": assessment.is_published,
        "created_at": assessment.created_at,
        "questions": questions,
    }


# ============================================================
# ADMIN - ALL ASSESSMENTS
# ============================================================

@router.get(
    "/admin/all",
    response_model=list[AssessmentResponse],
)
def get_all_assessments(
    db: Session = Depends(get_db),
    _: object = Depends(require_admin),
):
    return db.scalars(
        select(Assessment)
        .order_by(
            Assessment.id.desc()
        )
    ).all()


# ============================================================
# ADMIN - CREATE BATTLE
# ============================================================

@router.post(
    "",
    response_model=AssessmentResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_assessment(
    data: AssessmentCreate,
    db: Session = Depends(get_db),
    _: object = Depends(require_admin),
):
    # --------------------------------------------------------
    # VALIDATE SKILL
    # --------------------------------------------------------

    if data.skill_id is not None:

        skill = db.get(
            Skill,
            data.skill_id,
        )

        if not skill:
            raise HTTPException(
                status_code=404,
                detail="Skill not found",
            )

        if not skill.is_active:
            raise HTTPException(
                status_code=400,
                detail="Skill is inactive",
            )

    # --------------------------------------------------------
    # VALIDATE DIFFICULTY
    # --------------------------------------------------------

    allowed_difficulties = {
        "BEGINNER",
        "EASY",
        "MEDIUM",
        "HARD",
        "MIXED",
    }

    difficulty = data.difficulty.upper()

    if difficulty not in allowed_difficulties:
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid difficulty. Use "
                "BEGINNER, EASY, MEDIUM, HARD or MIXED."
            ),
        )

    # --------------------------------------------------------
    # CREATE DRAFT
    # --------------------------------------------------------

    assessment = Assessment(
        title=data.title.strip(),

        description=(
            data.description.strip()
            if data.description
            else None
        ),

        assessment_type=(
            data.assessment_type.upper()
        ),

        skill_id=data.skill_id,

        topic=(
            data.topic.strip()
            if data.topic
            else None
        ),

        difficulty=difficulty,

        question_count=data.question_count,

        duration_minutes=data.duration_minutes,

        passing_percentage=data.passing_percentage,

        max_attempts=data.max_attempts,

        is_published=False,
    )

    db.add(assessment)

    db.commit()

    db.refresh(assessment)

    return assessment


# ============================================================
# ADMIN - PUBLISH BATTLE
#
# THIS IS WHERE AUTOMATIC QUESTION SELECTION HAPPENS
# ============================================================

@router.patch(
    "/{assessment_id}/publish",
    response_model=AssessmentResponse,
)
def publish_assessment(
    assessment_id: int,
    db: Session = Depends(get_db),
    _: object = Depends(require_admin),
):
    assessment = db.get(
        Assessment,
        assessment_id,
    )

    if not assessment:
        raise HTTPException(
            status_code=404,
            detail="Assessment not found",
        )

    if assessment.is_published:
        raise HTTPException(
            status_code=400,
            detail="Assessment is already published",
        )

    # --------------------------------------------------------
    # CHECK IF QUESTIONS ALREADY EXIST
    # --------------------------------------------------------

    existing_questions = db.scalar(
        select(
            func.count(
                AssessmentQuestion.id
            )
        ).where(
            AssessmentQuestion.assessment_id
            == assessment.id
        )
    ) or 0

    if existing_questions > 0:
        raise HTTPException(
            status_code=400,
            detail=(
                "Questions are already assigned "
                "to this battle."
            ),
        )

    # --------------------------------------------------------
    # BUILD QUESTION QUERY
    # --------------------------------------------------------

    query = select(
        Question
    ).where(
        Question.is_active.is_(True)
    )

    # --------------------------------------------------------
    # SKILL
    # --------------------------------------------------------

    if assessment.skill_id is not None:

        query = query.where(
            Question.skill_id
            == assessment.skill_id
        )

    # --------------------------------------------------------
    # TOPIC
    # --------------------------------------------------------

    if assessment.topic:

        query = query.where(
            func.lower(
                Question.topic
            )
            == assessment.topic.strip().lower()
        )

    # --------------------------------------------------------
    # DIFFICULTY
    # --------------------------------------------------------

    if assessment.difficulty not in {
        "BEGINNER",
        "MIXED",
    }:

        query = query.where(
            Question.difficulty
            == assessment.difficulty
        )

    # --------------------------------------------------------
    # RANDOM QUESTIONS
    # --------------------------------------------------------

    query = (
        query
        .order_by(
            func.random()
        )
        .limit(
            assessment.question_count
        )
    )

    questions = db.scalars(
        query
    ).all()

    # --------------------------------------------------------
    # NOT ENOUGH QUESTIONS
    # --------------------------------------------------------

    if len(questions) < assessment.question_count:

        raise HTTPException(
            status_code=400,
            detail=(
                "Not enough questions available "
                "for this battle configuration. "
                f"Required: "
                f"{assessment.question_count}, "
                f"Available: "
                f"{len(questions)}."
            ),
        )

    # --------------------------------------------------------
    # CREATE ASSESSMENT QUESTIONS
    # --------------------------------------------------------

    for index, question in enumerate(
        questions,
        start=1,
    ):
        db.add(
            AssessmentQuestion(
                assessment_id=assessment.id,
                question_id=question.id,
                question_order=index,
            )
        )

    # --------------------------------------------------------
    # PUBLISH
    # --------------------------------------------------------

    assessment.is_published = True

    db.commit()

    db.refresh(assessment)

    return assessment


# ============================================================
# ADMIN - MANUAL QUESTION ADDITION
# ============================================================

@router.post(
    "/{assessment_id}/questions",
)
def add_question_to_assessment(
    assessment_id: int,
    data: AssessmentQuestionCreate,
    db: Session = Depends(get_db),
    _: object = Depends(require_admin),
):
    assessment = db.get(
        Assessment,
        assessment_id,
    )

    if not assessment:
        raise HTTPException(
            status_code=404,
            detail="Assessment not found",
        )

    if assessment.is_published:
        raise HTTPException(
            status_code=400,
            detail=(
                "Cannot modify questions "
                "after publishing."
            ),
        )

    question = db.get(
        Question,
        data.question_id,
    )

    if not question:
        raise HTTPException(
            status_code=404,
            detail="Question not found",
        )

    existing = db.scalar(
        select(
            AssessmentQuestion
        ).where(
            AssessmentQuestion.assessment_id
            == assessment_id,
            AssessmentQuestion.question_id
            == data.question_id,
        )
    )

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Question already added",
        )

    assessment_question = AssessmentQuestion(
        assessment_id=assessment_id,
        question_id=data.question_id,
        question_order=data.question_order,
    )

    db.add(
        assessment_question
    )

    db.commit()

    db.refresh(
        assessment_question
    )

    return {
        "message": "Question added to assessment",
        "assessment_question_id":
            assessment_question.id,
    }


# ============================================================
# ADMIN - GET BATTLE QUESTIONS
# ============================================================

@router.get(
    "/{assessment_id}/questions",
    response_model=list[QuestionResponse],
)
def get_assessment_questions(
    assessment_id: int,
    db: Session = Depends(get_db),
    _: object = Depends(require_admin),
):
    assessment = db.get(
        Assessment,
        assessment_id,
    )

    if not assessment:
        raise HTTPException(
            status_code=404,
            detail="Assessment not found",
        )

    questions = db.scalars(
        select(Question)
        .join(
            AssessmentQuestion,
            AssessmentQuestion.question_id
            == Question.id,
        )
        .options(
            selectinload(
                Question.options
            )
        )
        .where(
            AssessmentQuestion.assessment_id
            == assessment_id,
            Question.is_active.is_(True),
        )
        .order_by(
            AssessmentQuestion.question_order
        )
    ).all()

    return questions