from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    UploadFile,
    File,
    status,
)

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.api.dependencies import require_admin
from app.db.session import get_db
from app.models.option import Option
from app.models.question import Question
from app.models.skill import Skill
from app.schemas.question import (
    QuestionCreate,
    QuestionResponse,
)

import csv
import io


router = APIRouter(
    prefix="/questions",
    tags=["Questions"],
)


# ============================================================
# GET ALL QUESTIONS
# ============================================================

@router.get(
    "",
    response_model=list[QuestionResponse],
)
def get_questions(
    skill_id: int | None = None,
    difficulty: str | None = None,
    db: Session = Depends(get_db),
    _: object = Depends(require_admin),
):
    query = (
        select(Question)
        .options(
            selectinload(Question.options)
        )
        .where(
            Question.is_active.is_(True)
        )
        .order_by(
            Question.id.desc()
        )
    )

    if skill_id:
        query = query.where(
            Question.skill_id == skill_id
        )

    if difficulty:
        query = query.where(
            Question.difficulty == difficulty
        )

    return db.scalars(query).all()


# ============================================================
# GET SINGLE QUESTION
# ============================================================

@router.get(
    "/{question_id}",
    response_model=QuestionResponse,
)
def get_question(
    question_id: int,
    db: Session = Depends(get_db),
    _: object = Depends(require_admin),
):
    question = db.scalar(
        select(Question)
        .options(
            selectinload(Question.options)
        )
        .where(
            Question.id == question_id
        )
    )

    if not question:
        raise HTTPException(
            status_code=404,
            detail="Question not found",
        )

    return question


# ============================================================
# CREATE QUESTION
# ============================================================

@router.post(
    "",
    response_model=QuestionResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_question(
    data: QuestionCreate,
    db: Session = Depends(get_db),
    _: object = Depends(require_admin),
):
    skill = db.get(
        Skill,
        data.skill_id,
    )

    if not skill:
        raise HTTPException(
            status_code=404,
            detail="Skill not found",
        )

    correct_count = sum(
        option.is_correct
        for option in data.options
    )

    if correct_count != 1:
        raise HTTPException(
            status_code=400,
            detail=(
                "Exactly one option "
                "must be correct"
            ),
        )

    question = Question(
        skill_id=data.skill_id,
        question_text=data.question_text,
        difficulty=data.difficulty,
        marks=data.marks,
        explanation=data.explanation,
    )

    for option_data in data.options:
        question.options.append(
            Option(
                option_text=
                    option_data.option_text,
                is_correct=
                    option_data.is_correct,
            )
        )

    db.add(question)
    db.commit()
    db.refresh(question)

    return question


# ============================================================
# IMPORT QUESTIONS FROM CSV
# ============================================================

@router.post(
    "/import-csv",
    status_code=status.HTTP_201_CREATED,
)
def import_questions_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _: object = Depends(require_admin),
):
    # ========================================================
    # FILE VALIDATION
    # ========================================================

    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="No file selected",
        )

    if not file.filename.lower().endswith(
        ".csv"
    ):
        raise HTTPException(
            status_code=400,
            detail="Only CSV files are allowed",
        )

    # ========================================================
    # READ CSV
    # ========================================================

    try:
        content = (
            file.file
            .read()
            .decode("utf-8-sig")
        )

    except UnicodeDecodeError:
        raise HTTPException(
            status_code=400,
            detail="CSV must be UTF-8 encoded",
        )

    if not content.strip():
        raise HTTPException(
            status_code=400,
            detail="CSV file is empty",
        )

    reader = csv.DictReader(
        io.StringIO(content)
    )

    if not reader.fieldnames:
        raise HTTPException(
            status_code=400,
            detail="CSV file is empty",
        )

    # ========================================================
    # NORMALIZE HEADERS
    # ========================================================

    normalized_headers = {}

    for header in reader.fieldnames:
        normalized = (
            header or ""
        ).strip().lower()

        normalized_headers[
            normalized
        ] = header

    # ========================================================
    # REQUIRED HEADERS
    # ========================================================

    required_headers = {
        "topic",
        "question_text",
        "difficulty",
        "marks",
        "option_a",
        "option_b",
        "option_c",
        "option_d",
        "correct_option",
        "explanation",
    }

    missing_headers = (
        required_headers
        - set(normalized_headers.keys())
    )

    if missing_headers:
        raise HTTPException(
            status_code=400,
            detail={
                "message":
                    "Missing required CSV columns",

                "missing_columns":
                    sorted(
                        missing_headers
                    ),
            },
        )

    # ========================================================
    # FIND SKILL COLUMN
    #
    # Your CSV has a blank first header.
    # That column contains:
    #
    # HTML
    # CSS
    # JavaScript
    # React
    # Python
    # etc.
    #
    # We support:
    #
    # blank header
    # skill
    # category
    # ========================================================

    skill_header = None

    for header in reader.fieldnames:

        normalized = (
            header or ""
        ).strip().lower()

        if normalized in {
            "",
            "skill",
            "category",
        }:
            skill_header = header
            break

    if skill_header is None:
        raise HTTPException(
            status_code=400,
            detail=(
                "Could not find the "
                "skill/category column "
                "in the CSV."
            ),
        )

    # ========================================================
    # IMPORT COUNTERS
    # ========================================================

    created = 0
    updated = 0
    skills_created = 0
    skipped = 0
    failed = []

    rows = list(reader)

    if not rows:
        raise HTTPException(
            status_code=400,
            detail="CSV contains no questions",
        )

    # ========================================================
    # PROCESS CSV
    # ========================================================

    try:

        for row_number, row in enumerate(
            rows,
            start=2,
        ):

            try:

                # ====================================================
                # READ BASIC DATA
                # ====================================================

                skill_name = (
                    row.get(skill_header)
                    or ""
                ).strip()

                topic = (
                    row.get("topic")
                    or ""
                ).strip()

                question_text = (
                    row.get("question_text")
                    or ""
                ).strip()

                difficulty = (
                    row.get("difficulty")
                    or "EASY"
                ).strip().upper()

                explanation = (
                    row.get("explanation")
                    or ""
                ).strip()

                correct_option = (
                    row.get("correct_option")
                    or ""
                ).strip().upper()

                # ====================================================
                # VALIDATE SKILL
                # ====================================================

                if not skill_name:
                    raise ValueError(
                        "Skill/category is missing"
                    )

                # ====================================================
                # VALIDATE QUESTION
                # ====================================================

                if not question_text:
                    raise ValueError(
                        "Question text is missing"
                    )

                # ====================================================
                # VALIDATE DIFFICULTY
                # ====================================================

                if difficulty not in {
                    "EASY",
                    "MEDIUM",
                    "HARD",
                }:
                    raise ValueError(
                        f"Invalid difficulty: "
                        f"{difficulty}. "
                        f"Allowed values: "
                        f"EASY, MEDIUM, HARD"
                    )

                # ====================================================
                # VALIDATE CORRECT OPTION
                # ====================================================

                if correct_option not in {
                    "A",
                    "B",
                    "C",
                    "D",
                }:
                    raise ValueError(
                        "correct_option must be "
                        "A, B, C or D"
                    )

                # ====================================================
                # MARKS
                # ====================================================

                marks_raw = (
                    row.get("marks")
                    or "1"
                ).strip()

                try:
                    marks = int(
                        marks_raw
                    )

                except ValueError:
                    raise ValueError(
                        "Marks must be an integer"
                    )

                if marks < 1:
                    raise ValueError(
                        "Marks must be at least 1"
                    )

                # ====================================================
                # OPTIONS
                # ====================================================

                options = {
                    "A": (
                        row.get("option_a")
                        or ""
                    ).strip(),

                    "B": (
                        row.get("option_b")
                        or ""
                    ).strip(),

                    "C": (
                        row.get("option_c")
                        or ""
                    ).strip(),

                    "D": (
                        row.get("option_d")
                        or ""
                    ).strip(),
                }

                # ====================================================
                # VALIDATE OPTIONS
                # ====================================================

                for letter, text in options.items():

                    if not text:
                        raise ValueError(
                            f"Option {letter} "
                            "is empty"
                        )

                # ====================================================
                # FIND OR CREATE SKILL
                # ====================================================

                skill = db.scalar(
                    select(Skill).where(
                        Skill.name.ilike(
                            skill_name
                        )
                    )
                )

                # ====================================================
                # SKILL DOES NOT EXIST
                #
                # CREATE IT AUTOMATICALLY
                # ====================================================

                if not skill:

                    skill = Skill(
                        name=skill_name,
                    )

                    db.add(skill)

                    # Flush so skill.id exists
                    # immediately.

                    db.flush()

                    skills_created += 1

                # ====================================================
                # FIND EXISTING QUESTION
                # ====================================================

                existing_question = db.scalar(
                    select(Question)
                    .options(
                        selectinload(
                            Question.options
                        )
                    )
                    .where(
                        Question.skill_id
                        == skill.id,

                        Question.question_text
                        == question_text,
                    )
                )

                # ====================================================
                # UPDATE EXISTING QUESTION
                # ====================================================

                if existing_question:

                    existing_question.topic = (
                        topic
                    )

                    existing_question.difficulty = (
                        difficulty
                    )

                    existing_question.marks = (
                        marks
                    )

                    existing_question.explanation = (
                        explanation
                        or None
                    )

                    # --------------------------------------------
                    # Replace existing options
                    # --------------------------------------------

                    existing_question.options.clear()

                    for letter, text in (
                        options.items()
                    ):

                        existing_question.options.append(
                            Option(
                                option_text=text,

                                is_correct=(
                                    letter
                                    == correct_option
                                ),
                            )
                        )

                    updated += 1

                # ====================================================
                # CREATE NEW QUESTION
                # ====================================================

                else:

                    question = Question(
                        skill_id=skill.id,

                        topic=topic,

                        question_text=
                            question_text,

                        difficulty=
                            difficulty,

                        marks=marks,

                        explanation=(
                            explanation
                            or None
                        ),
                    )

                    # --------------------------------------------
                    # Add options
                    # --------------------------------------------

                    for letter, text in (
                        options.items()
                    ):

                        question.options.append(
                            Option(
                                option_text=text,

                                is_correct=(
                                    letter
                                    == correct_option
                                ),
                            )
                        )

                    db.add(question)

                    created += 1

            # ====================================================
            # ROW ERROR
            # ====================================================

            except Exception as error:

                failed.append({
                    "row": row_number,
                    "error": str(error),
                })

        # ========================================================
        # TRANSACTION SAFETY
        #
        # If even one row fails:
        #
        # ROLLBACK EVERYTHING
        #
        # This prevents half-imported CSV files.
        # ========================================================

        if failed:

            db.rollback()

            raise HTTPException(
                status_code=400,
                detail={
                    "message": (
                        "Import failed. "
                        "No changes were committed."
                    ),

                    "failed_rows":
                        failed,
                },
            )

        # ========================================================
        # COMMIT EVERYTHING
        # ========================================================

        db.commit()

    except HTTPException:
        raise

    except Exception as error:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=(
                f"CSV import failed: "
                f"{str(error)}"
            ),
        )

    # ========================================================
    # SUCCESS RESPONSE
    # ========================================================

    return {
        "message":
            "Question bank imported successfully",

        "created":
            created,

        "updated":
            updated,

        "skills_created":
            skills_created,

        "skipped":
            skipped,

        "failed":
            0,

        "total":
            created + updated,

        "rows_processed":
            len(rows),
    }


# ============================================================
# DELETE QUESTION
# ============================================================

@router.delete(
    "/{question_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_question(
    question_id: int,
    db: Session = Depends(get_db),
    _: object = Depends(require_admin),
):
    question = db.get(
        Question,
        question_id,
    )

    if not question:
        raise HTTPException(
            status_code=404,
            detail="Question not found",
        )

    # Soft delete

    question.is_active = False

    db.commit()

    return None