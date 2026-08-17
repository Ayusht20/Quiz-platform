from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import (
    require_admin,
    require_student,
)
from app.db.session import get_db

from app.models.category import Category
from app.models.skill import Skill
from app.models.skill_progress import SkillProgress
from app.models.user import User

from app.schemas.skill import (
    SkillCreate,
    SkillUpdate,
    SkillResponse,
    SkillProgressResponse,
)


router = APIRouter(
    prefix="/skills",
    tags=["Skills"],
)


# ============================================================
# GET ALL SKILLS
# ============================================================

@router.get(
    "",
    response_model=list[SkillResponse],
)
def get_skills(
    db: Session = Depends(get_db),
    _: object = Depends(require_admin),
):
    skills = db.scalars(
        select(Skill)
        .where(
            Skill.is_active.is_(True)
        )
        .order_by(
            Skill.name.asc()
        )
    ).all()

    return skills


# ============================================================
# GET MY SKILL PROGRESS
#
# IMPORTANT:
# This MUST appear BEFORE /{skill_id}
#
# Otherwise:
#
# /skills/progress
#
# could be interpreted as:
#
# /skills/{skill_id}
# ============================================================

@router.get(
    "/progress",
    response_model=list[SkillProgressResponse],
)
def get_my_skill_progress(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student),
):
    rows = db.execute(
        select(
            Skill.id,
            Skill.name,
            Skill.category_id,
            Category.name,
            SkillProgress.xp,
            SkillProgress.questions_answered,
            SkillProgress.questions_correct,
            SkillProgress.battles_completed,
            SkillProgress.completed,
            SkillProgress.mastered,
        )
        .join(
            Category,
            Category.id == Skill.category_id,
        )
        .outerjoin(
            SkillProgress,
            (
                SkillProgress.skill_id
                == Skill.id
            )
            & (
                SkillProgress.user_id
                == current_user.id
            ),
        )
        .where(
            Skill.is_active.is_(True)
        )
        .order_by(
            Category.name.asc(),
            Skill.name.asc(),
        )
    ).all()

    result = []

    for row in rows:

        (
            skill_id,
            skill_name,
            category_id,
            category_name,
            xp,
            questions_answered,
            questions_correct,
            battles_completed,
            completed,
            mastered,
        ) = row

        # --------------------------------------------------------
        # Defaults for users who don't have a SkillProgress row yet
        # --------------------------------------------------------

        xp = xp or 0

        questions_answered = (
            questions_answered or 0
        )

        questions_correct = (
            questions_correct or 0
        )

        battles_completed = (
            battles_completed or 0
        )

        completed = (
            completed or False
        )

        mastered = (
            mastered or False
        )

        # --------------------------------------------------------
        # Accuracy
        # --------------------------------------------------------

        if questions_answered > 0:

            accuracy = (
                questions_correct
                / questions_answered
            ) * 100

        else:

            accuracy = 0

        # --------------------------------------------------------
        # Response
        # --------------------------------------------------------

        result.append(
            {
                "skill_id": skill_id,
                "skill_name": skill_name,
                "category_id": category_id,
                "category_name": category_name,

                "xp": xp,

                "questions_answered":
                    questions_answered,

                "questions_correct":
                    questions_correct,

                "battles_completed":
                    battles_completed,

                "accuracy": round(
                    accuracy,
                    2,
                ),

                "completed": completed,

                "mastered": mastered,
            }
        )

    return result


# ============================================================
# GET SINGLE SKILL
# ============================================================

@router.get(
    "/{skill_id}",
    response_model=SkillResponse,
)
def get_skill(
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

    return skill


# ============================================================
# CREATE SKILL
# ============================================================

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

    # --------------------------------------------------------
    # Check category
    # --------------------------------------------------------

    category = db.get(
        Category,
        data.category_id,
    )

    if not category:

        raise HTTPException(
            status_code=404,
            detail="Category not found",
        )

    # --------------------------------------------------------
    # Check duplicate skill name
    # --------------------------------------------------------

    existing_skill = db.scalar(
        select(Skill).where(
            Skill.name.ilike(
                data.name.strip()
            )
        )
    )

    if existing_skill:

        raise HTTPException(
            status_code=400,
            detail="Skill already exists",
        )

    # --------------------------------------------------------
    # Create
    # --------------------------------------------------------

    skill = Skill(
        category_id=data.category_id,
        name=data.name.strip(),
        description=data.description,
    )

    db.add(skill)

    db.commit()

    db.refresh(skill)

    return skill


# ============================================================
# UPDATE SKILL
# ============================================================

@router.patch(
    "/{skill_id}",
    response_model=SkillResponse,
)
def update_skill(
    skill_id: int,
    data: SkillUpdate,
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

    # --------------------------------------------------------
    # Update name
    # --------------------------------------------------------

    if data.name is not None:

        new_name = data.name.strip()

        existing_skill = db.scalar(
            select(Skill).where(
                Skill.name.ilike(
                    new_name
                ),
                Skill.id != skill_id,
            )
        )

        if existing_skill:

            raise HTTPException(
                status_code=400,
                detail="Skill already exists",
            )

        skill.name = new_name

    # --------------------------------------------------------
    # Update description
    # --------------------------------------------------------

    if data.description is not None:

        skill.description = (
            data.description
        )

    db.commit()

    db.refresh(skill)

    return skill