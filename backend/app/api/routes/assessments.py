from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, require_admin
from app.db.session import get_db
from app.models.assessment import Assessment
from app.schemas.assessment import (
    AssessmentCreate,
    AssessmentResponse,
)


router = APIRouter(
    prefix="/assessments",
    tags=["Assessments"],
)


@router.get(
    "",
    response_model=list[AssessmentResponse],
)
def get_assessments(
    db: Session = Depends(get_db),
):
    return db.scalars(
        select(Assessment)
        .where(Assessment.is_published.is_(True))
        .order_by(Assessment.id.desc())
    ).all()


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
        .order_by(Assessment.id.desc())
    ).all()


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
    assessment = Assessment(
        title=data.title,
        description=data.description,
        assessment_type=data.assessment_type,
        difficulty=data.difficulty,
        duration_minutes=data.duration_minutes,
        passing_percentage=data.passing_percentage,
        max_attempts=data.max_attempts,
    )

    db.add(assessment)
    db.commit()
    db.refresh(assessment)

    return assessment


@router.patch(
    "/{assessment_id}/publish",
    response_model=AssessmentResponse,
)
def publish_assessment(
    assessment_id: int,
    db: Session = Depends(get_db),
    _: object = Depends(require_admin),
):
    assessment = db.get(Assessment, assessment_id)

    if not assessment:
        raise HTTPException(
            status_code=404,
            detail="Assessment not found",
        )

    assessment.is_published = True

    db.commit()
    db.refresh(assessment)

    return assessment