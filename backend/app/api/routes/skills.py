from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import require_admin
from app.db.session import get_db
from app.models.category import Category
from app.models.skill import Skill
from app.schemas.skill import (
    SkillCreate,
    SkillResponse,
    SkillUpdate,
)


router = APIRouter(
    prefix="/skills",
    tags=["Skills"],
)


@router.get(
    "",
    response_model=list[SkillResponse],
)
def get_skills(
    category_id: int | None = None,
    db: Session = Depends(get_db),
):
    query = select(Skill)

    if category_id:
        query = query.where(
            Skill.category_id == category_id
        )

    return db.scalars(
        query.order_by(Skill.id)
    ).all()


@router.get(
    "/{skill_id}",
    response_model=SkillResponse,
)
def get_skill(
    skill_id: int,
    db: Session = Depends(get_db),
):
    skill = db.get(Skill, skill_id)

    if not skill:
        raise HTTPException(
            status_code=404,
            detail="Skill not found",
        )

    return skill


@router.post(
    "",
    response_model=SkillResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_skill(
    data: SkillCreate,
    db: Session = Depends(get_db),
    _: object = Depends(require_admin),
):
    category = db.get(Category, data.category_id)

    if not category:
        raise HTTPException(
            status_code=404,
            detail="Category not found",
        )

    skill = Skill(
        category_id=data.category_id,
        name=data.name,
        description=data.description,
    )

    db.add(skill)
    db.commit()
    db.refresh(skill)

    return skill


@router.put(
    "/{skill_id}",
    response_model=SkillResponse,
)
def update_skill(
    skill_id: int,
    data: SkillUpdate,
    db: Session = Depends(get_db),
    _: object = Depends(require_admin),
):
    skill = db.get(Skill, skill_id)

    if not skill:
        raise HTTPException(
            status_code=404,
            detail="Skill not found",
        )

    if data.name is not None:
        skill.name = data.name

    if data.description is not None:
        skill.description = data.description

    db.commit()
    db.refresh(skill)

    return skill


@router.delete(
    "/{skill_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_skill(
    skill_id: int,
    db: Session = Depends(get_db),
    _: object = Depends(require_admin),
):
    skill = db.get(Skill, skill_id)

    if not skill:
        raise HTTPException(
            status_code=404,
            detail="Skill not found",
        )

    db.delete(skill)
    db.commit()