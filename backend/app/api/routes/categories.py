from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import require_admin
from app.db.session import get_db
from app.models.category import Category
from app.schemas.category import (
    CategoryCreate,
    CategoryResponse,
    CategoryUpdate,
)


router = APIRouter(
    prefix="/categories",
    tags=["Categories"],
)


@router.get(
    "",
    response_model=list[CategoryResponse],
)
def get_categories(
    db: Session = Depends(get_db),
):
    return db.scalars(
        select(Category).order_by(Category.id)
    ).all()


@router.get(
    "/{category_id}",
    response_model=CategoryResponse,
)
def get_category(
    category_id: int,
    db: Session = Depends(get_db),
):
    category = db.get(Category, category_id)

    if not category:
        raise HTTPException(
            status_code=404,
            detail="Category not found",
        )

    return category


@router.post(
    "",
    response_model=CategoryResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_category(
    data: CategoryCreate,
    db: Session = Depends(get_db),
    _: object = Depends(require_admin),
):
    existing = db.scalar(
        select(Category).where(
            Category.name == data.name
        )
    )

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Category already exists",
        )

    category = Category(
        name=data.name,
        description=data.description,
    )

    db.add(category)
    db.commit()
    db.refresh(category)

    return category


@router.put(
    "/{category_id}",
    response_model=CategoryResponse,
)
def update_category(
    category_id: int,
    data: CategoryUpdate,
    db: Session = Depends(get_db),
    _: object = Depends(require_admin),
):
    category = db.get(Category, category_id)

    if not category:
        raise HTTPException(
            status_code=404,
            detail="Category not found",
        )

    if data.name is not None:
        category.name = data.name

    if data.description is not None:
        category.description = data.description

    db.commit()
    db.refresh(category)

    return category


@router.delete(
    "/{category_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    _: object = Depends(require_admin),
):
    category = db.get(Category, category_id)

    if not category:
        raise HTTPException(
            status_code=404,
            detail="Category not found",
        )

    db.delete(category)
    db.commit()