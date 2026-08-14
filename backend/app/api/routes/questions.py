import csv
import io

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    UploadFile,
    status,
)

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.api.dependencies import require_admin
from app.db.session import get_db

from app.models.category import Category
from app.models.option import Option
from app.models.question import Question
from app.models.skill import Skill

from app.schemas.question import (
    QuestionCreate,
    QuestionResponse,
)


router = APIRouter(
    prefix="/questions",
    tags=["Questions"],
)


# ============================================================
# DEFAULT CATEGORY
# ============================================================

DEFAULT_CATEGORY_NAME = "Technical Skills"


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

    if skill_id is not None:
        query = query.where(
            Question.skill_id == skill_id
        )

    if difficulty:
        query = query.where(
            Question.difficulty == difficulty.upper()
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
# CREATE SINGLE QUESTION
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
    # --------------------------------------------------------
    # FIND SKILL
    # --------------------------------------------------------

    skill = db.get(
        Skill,
        data.skill_id,
    )

    if not skill:
        raise HTTPException(
            status_code=404,
            detail="Skill not found",
        )

    # --------------------------------------------------------
    # VALIDATE CORRECT OPTION
    # --------------------------------------------------------

    correct_count = sum(
        option.is_correct
        for option in data.options
    )

    if correct_count != 1:
        raise HTTPException(
            status_code=400,
            detail="Exactly one option must be correct",
        )

    # --------------------------------------------------------
    # CREATE QUESTION
    # --------------------------------------------------------

    question = Question(
        skill_id=data.skill_id,
        topic=data.topic or None,
        question_text=data.question_text,
        difficulty=data.difficulty,
        marks=data.marks,
        explanation=data.explanation or None,
    )

    # --------------------------------------------------------
    # ADD OPTIONS
    # --------------------------------------------------------

    for option_data in data.options:

        question.options.append(
            Option(
                option_text=option_data.option_text,
                is_correct=option_data.is_correct,
            )
        )

    db.add(question)

    db.commit()

    db.refresh(question)

    return question


# ============================================================
# CSV IMPORT
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

    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=400,
            detail="Only CSV files are allowed",
        )

    # ========================================================
    # READ FILE
    # ========================================================

    try:

        content = file.file.read().decode(
            "utf-8-sig"
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

    # ========================================================
    # CSV READER
    # ========================================================

    reader = csv.DictReader(
        io.StringIO(content)
    )

    if not reader.fieldnames:

        raise HTTPException(
            status_code=400,
            detail="CSV header is missing",
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
    # REQUIRED COLUMNS
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
                "message": (
                    "Missing required CSV columns"
                ),
                "missing_columns": sorted(
                    missing_headers
                ),
                "received_columns": [
                    header
                    for header in reader.fieldnames
                ],
            },
        )

    # ========================================================
    # FIND SKILL COLUMN
    #
    # Your generated CSV has a blank first header:
    #
    # [blank] | topic | question_text | ...
    #
    # Example:
    #
    # HTML    | Web Components | ...
    # Python  | Dataclasses    | ...
    #
    # We support:
    #
    # blank
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
                "skill/category column."
            ),
        )

    # ========================================================
    # READ ROWS
    # ========================================================

    rows = list(reader)

    if not rows:

        raise HTTPException(
            status_code=400,
            detail="CSV contains no questions",
        )

    # ========================================================
    # COUNTERS
    # ========================================================

    created = 0
    updated = 0
    skills_created = 0
    categories_created = 0

    failed = []

    # ========================================================
    # FIND / CREATE DEFAULT CATEGORY
    # ========================================================

    default_category = db.scalar(
        select(Category).where(
            Category.name.ilike(
                DEFAULT_CATEGORY_NAME
            )
        )
    )

    if not default_category:

        default_category = Category(
            name=DEFAULT_CATEGORY_NAME,
            description=(
                "Technical programming "
                "and development skills."
            ),
        )

        db.add(default_category)

        db.flush()

        categories_created += 1

    # ========================================================
    # PROCESS EVERY CSV ROW
    # ========================================================

    for row_number, row in enumerate(
        rows,
        start=2,
    ):

        try:

            # ====================================================
            # SAVEPOINT
            #
            # If one row fails, only that row is rolled back.
            # ====================================================

            with db.begin_nested():

                # ================================================
                # READ VALUES
                # ================================================

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

                # ================================================
                # VALIDATE SKILL
                # ================================================

                if not skill_name:

                    raise ValueError(
                        "Skill is missing"
                    )

                # ================================================
                # VALIDATE QUESTION
                # ================================================

                if not question_text:

                    raise ValueError(
                        "Question text is missing"
                    )

                # ================================================
                # VALIDATE DIFFICULTY
                # ================================================

                if difficulty not in {
                    "EASY",
                    "MEDIUM",
                    "HARD",
                }:

                    raise ValueError(
                        f"Invalid difficulty "
                        f"'{difficulty}'. "
                        "Expected EASY, MEDIUM or HARD."
                    )

                # ================================================
                # VALIDATE CORRECT OPTION
                # ================================================

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

                # ================================================
                # MARKS
                # ================================================

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

                # ================================================
                # OPTIONS
                # ================================================

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

                # ================================================
                # VALIDATE OPTIONS
                # ================================================

                for letter, text in options.items():

                    if not text:

                        raise ValueError(
                            f"Option {letter} "
                            "is empty"
                        )

                # ================================================
                # FIND SKILL
                # ================================================

                skill = db.scalar(
                    select(Skill).where(
                        Skill.name.ilike(
                            skill_name
                        )
                    )
                )

                # ================================================
                # CREATE SKILL IF MISSING
                # ================================================

                if not skill:

                    skill = Skill(
                        category_id=(
                            default_category.id
                        ),
                        name=skill_name,
                        description=(
                            f"{skill_name} "
                            "technical skill"
                        ),
                    )

                    db.add(skill)

                    db.flush()

                    skills_created += 1

                # ================================================
                # FIND EXISTING QUESTION
                #
                # Match:
                #
                # skill + question_text
                #
                # This prevents duplicates.
                # ================================================

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

                # ================================================
                # UPDATE EXISTING QUESTION
                # ================================================

                if existing_question:

                    existing_question.topic = (
                        topic or None
                    )

                    existing_question.difficulty = (
                        difficulty
                    )

                    existing_question.marks = (
                        marks
                    )

                    existing_question.explanation = (
                        explanation or None
                    )

                    # --------------------------------------------
                    # REMOVE OLD OPTIONS
                    # --------------------------------------------

                    existing_question.options.clear()

                    # --------------------------------------------
                    # ADD NEW OPTIONS
                    # --------------------------------------------

                    for letter, text in options.items():

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

                # ================================================
                # CREATE NEW QUESTION
                # ================================================

                else:

                    question = Question(
                        skill_id=skill.id,
                        topic=topic or None,
                        question_text=question_text,
                        difficulty=difficulty,
                        marks=marks,
                        explanation=(
                            explanation
                            or None
                        ),
                    )

                    # --------------------------------------------
                    # ADD OPTIONS
                    # --------------------------------------------

                    for letter, text in options.items():

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

        # ========================================================
        # ROW FAILED
        # ========================================================

        except Exception as error:

            failed.append(
                {
                    "row": row_number,
                    "error": str(error),
                }
            )

            # begin_nested() has already rolled
            # back this row's savepoint.

            continue

    # ========================================================
    # IF ANY ROW FAILED
    #
    # DO NOT PARTIALLY IMPORT THE CSV.
    # ========================================================

    if failed:

        db.rollback()

        raise HTTPException(
            status_code=400,
            detail={
                "message": (
                    "CSV import failed. "
                    "No changes were committed."
                ),
                "failed_rows": failed,
                "total_rows": len(rows),
                "failed_count": len(failed),
            },
        )

    # ========================================================
    # COMMIT EVERYTHING
    # ========================================================

    try:

        db.commit()

    except Exception as error:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to commit CSV import: "
                f"{str(error)}"
            ),
        )

    # ========================================================
    # SUCCESS
    # ========================================================

    return {
        "message": (
            "Question bank imported successfully"
        ),
        "rows_processed": len(rows),
        "created": created,
        "updated": updated,
        "skills_created": skills_created,
        "categories_created": categories_created,
        "failed": 0,
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

    # --------------------------------------------------------
    # SOFT DELETE
    # --------------------------------------------------------

    question.is_active = False

    db.commit()

    return None