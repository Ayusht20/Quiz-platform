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
from pydantic import BaseModel, ConfigDict
from sqlalchemy import func, select
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


router = APIRouter(
    prefix="/questions",
    tags=["Questions"],
)


# ============================================================
# PAGINATED QUESTION RESPONSE
# ============================================================


class QuestionListResponse(BaseModel):
    items: list[QuestionResponse]

    total: int

    easy: int
    medium: int
    hard: int

    page: int
    page_size: int

    model_config = ConfigDict(
        from_attributes=True
    )


# ============================================================
# GET QUESTIONS
#
# OPTIMIZED FOR LARGE QUESTION BANKS
#
# - Server-side pagination
# - Server-side search
# - Server-side difficulty/topic filtering
# - Returns TOTAL question count
# - Returns difficulty statistics
# - Loads options only for current page
# - Never downloads the complete question bank
# ============================================================


@router.get(
    "",
    response_model=QuestionListResponse,
)
def get_questions(
    skill_id: int | None = None,
    difficulty: str | None = None,
    topic: str | None = None,
    search: str | None = None,
    page: int = 1,
    page_size: int = 25,
    db: Session = Depends(get_db),
    _: object = Depends(require_admin),
):

    # --------------------------------------------------------
    # SAFE PAGINATION
    # --------------------------------------------------------

    page = max(page, 1)

    page_size = max(
        1,
        min(page_size, 50),
    )

    offset = (page - 1) * page_size

    # --------------------------------------------------------
    # BUILD FILTERS
    # --------------------------------------------------------

    filters = [
        Question.is_active.is_(True)
    ]

    # --------------------------------------------------------
    # SKILL FILTER
    # --------------------------------------------------------

    if skill_id is not None:
        filters.append(
            Question.skill_id == skill_id
        )

    # --------------------------------------------------------
    # DIFFICULTY FILTER
    # --------------------------------------------------------

    if difficulty:
        difficulty_value = (
            difficulty.strip().upper()
        )

        if difficulty_value:
            filters.append(
                Question.difficulty
                == difficulty_value
            )

    # --------------------------------------------------------
    # TOPIC FILTER
    # --------------------------------------------------------

    if topic:
        topic_value = topic.strip()

        if topic_value:
            filters.append(
                Question.topic.ilike(
                    topic_value
                )
            )

    # --------------------------------------------------------
    # SEARCH
    # --------------------------------------------------------

    if search:
        search_value = search.strip()

        if search_value:

            search_pattern = (
                f"%{search_value}%"
            )

            filters.append(
                (
                    Question.question_text.ilike(
                        search_pattern
                    )
                )
                |
                (
                    Question.topic.ilike(
                        search_pattern
                    )
                )
            )

    # ========================================================
    # TOTAL MATCHING QUESTIONS
    # ========================================================

    total = db.scalar(
        select(
            func.count(Question.id)
        ).where(
            *filters
        )
    ) or 0

    # ========================================================
    # DIFFICULTY STATISTICS
    #
    # These show the total active question bank,
    # independent of pagination.
    # ========================================================

    difficulty_counts = db.execute(
        select(
            Question.difficulty,
            func.count(Question.id),
        )
        .where(
            Question.is_active.is_(True)
        )
        .group_by(
            Question.difficulty
        )
    ).all()

    difficulty_map = {
        str(difficulty_value).upper(): count
        for difficulty_value, count
        in difficulty_counts
    }

    easy_count = difficulty_map.get(
        "EASY",
        0,
    )

    medium_count = difficulty_map.get(
        "MEDIUM",
        0,
    )

    hard_count = difficulty_map.get(
        "HARD",
        0,
    )

    # ========================================================
    # FETCH ONLY CURRENT PAGE
    # ========================================================

    query = (
        select(Question)
        .options(
            selectinload(
                Question.options
            )
        )
        .where(
            *filters
        )
        .order_by(
            Question.id.desc()
        )
        .offset(offset)
        .limit(page_size)
    )

    questions = db.scalars(
        query
    ).unique().all()

    # ========================================================
    # RESPONSE
    # ========================================================

    return {
        "items": questions,

        "total": total,

        "easy": easy_count,
        "medium": medium_count,
        "hard": hard_count,

        "page": page,
        "page_size": page_size,
    }


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
            selectinload(
                Question.options
            )
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
            detail=(
                "Exactly one option must be correct"
            ),
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
                option_text=(
                    option_data.option_text
                ),
                is_correct=(
                    option_data.is_correct
                ),
            )
        )

    db.add(question)

    db.commit()

    db.refresh(question)

    return question


# ============================================================
# CSV IMPORT
#
# OPTIMIZED VERSION
#
# - Loads skills once
# - Loads existing questions once
# - Loads options once
# - Uses in-memory dictionaries
# - Updates existing questions
# - Does not recreate options unnecessarily
# - Preserves topic
# - Prevents duplicate questions
# - Uses one final commit
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
    # VALIDATE FILE
    # ========================================================

    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="CSV file is required.",
        )

    if not file.filename.lower().endswith(
        ".csv"
    ):
        raise HTTPException(
            status_code=400,
            detail="Only CSV files are allowed.",
        )

    # ========================================================
    # READ CSV
    # ========================================================

    try:

        content = file.file.read()

        if not content:
            raise HTTPException(
                status_code=400,
                detail="CSV file is empty.",
            )

        try:
            text = content.decode(
                "utf-8-sig"
            )
        except UnicodeDecodeError:
            text = content.decode(
                "utf-8"
            )

        reader = csv.DictReader(
            io.StringIO(text)
        )

        rows = list(reader)

    except HTTPException:
        raise

    except Exception as exc:

        raise HTTPException(
            status_code=400,
            detail=(
                "Unable to read CSV file: "
                + str(exc)
            ),
        )

    if not rows:
        raise HTTPException(
            status_code=400,
            detail=(
                "CSV file contains no data rows."
            ),
        )

    # ========================================================
    # NORMALIZE HEADERS
    # ========================================================

    original_headers = (
        reader.fieldnames or []
    )

    normalized_headers = {
        (header or "").strip().lower()
        for header in original_headers
    }

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
        - normalized_headers
    )

    if missing_headers:

        raise HTTPException(
            status_code=400,
            detail=(
                "Missing CSV columns: "
                + ", ".join(
                    sorted(
                        missing_headers
                    )
                )
            ),
        )

    # ========================================================
    # FIND SKILL COLUMN
    # ========================================================

    skill_column = None

    for column in original_headers:

        normalized = (
            column or ""
        ).strip().lower()

        if normalized in {
            "skill",
            "category",
        }:

            skill_column = column

            break

    # ========================================================
    # BACKWARD COMPATIBILITY
    # ========================================================

    if skill_column is None:

        for column in original_headers:

            if (
                column is not None
                and column.strip() == ""
            ):

                skill_column = column

                break

    if skill_column is None:

        raise HTTPException(
            status_code=400,
            detail=(
                "CSV must contain a "
                "'skill' or 'category' column."
            ),
        )

    # ========================================================
    # LOAD ALL SKILLS ONCE
    # ========================================================

    skills = db.scalars(
        select(Skill)
    ).all()

    skill_map = {
        skill.name.strip().lower(): skill
        for skill in skills
    }

    # ========================================================
    # LOAD EXISTING QUESTIONS ONCE
    # ========================================================

    existing_questions = db.scalars(
        select(Question)
        .options(
            selectinload(
                Question.options
            )
        )
    ).unique().all()

    # ========================================================
    # CREATE QUESTION MAP
    # ========================================================

    question_map = {
        (
            question.skill_id,
            question.question_text
            .strip()
            .lower(),
        ): question
        for question in existing_questions
    }

    # ========================================================
    # STATISTICS
    # ========================================================

    created_count = 0
    updated_count = 0
    skipped_count = 0
    failed_count = 0

    errors = []

    # ========================================================
    # PROCESS CSV
    # ========================================================

    for row_number, row in enumerate(
        rows,
        start=2,
    ):

        try:

            # ------------------------------------------------
            # READ VALUES
            # ------------------------------------------------

            skill_name = (
                row.get(skill_column)
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
                or ""
            ).strip().upper()

            marks_raw = (
                row.get("marks")
                or ""
            ).strip()

            option_a = (
                row.get("option_a")
                or ""
            ).strip()

            option_b = (
                row.get("option_b")
                or ""
            ).strip()

            option_c = (
                row.get("option_c")
                or ""
            ).strip()

            option_d = (
                row.get("option_d")
                or ""
            ).strip()

            correct_option = (
                row.get("correct_option")
                or ""
            ).strip().upper()

            explanation = (
                row.get("explanation")
                or ""
            ).strip()

            # ------------------------------------------------
            # VALIDATION
            # ------------------------------------------------

            if not skill_name:
                raise ValueError(
                    "Skill is required."
                )

            if not topic:
                raise ValueError(
                    "Topic cannot be blank."
                )

            if not question_text:
                raise ValueError(
                    "Question text is required."
                )

            if difficulty not in {
                "EASY",
                "MEDIUM",
                "HARD",
            }:

                raise ValueError(
                    "Difficulty must be EASY, "
                    "MEDIUM or HARD."
                )

            try:
                marks = int(marks_raw)

            except ValueError:

                raise ValueError(
                    "Marks must be an integer."
                )

            if marks <= 0:

                raise ValueError(
                    "Marks must be greater than 0."
                )

            if correct_option not in {
                "A",
                "B",
                "C",
                "D",
            }:

                raise ValueError(
                    "Correct option must be "
                    "A, B, C or D."
                )

            options = {
                "A": option_a,
                "B": option_b,
                "C": option_c,
                "D": option_d,
            }

            if any(
                not value
                for value in options.values()
            ):

                raise ValueError(
                    "All four options are required."
                )

            # ------------------------------------------------
            # FIND SKILL
            # ------------------------------------------------

            skill = skill_map.get(
                skill_name.lower()
            )

            if not skill:

                raise ValueError(
                    f"Skill '{skill_name}' "
                    "not found."
                )

            # ------------------------------------------------
            # QUESTION KEY
            # ------------------------------------------------

            question_key = (
                skill.id,
                question_text.lower(),
            )

            existing_question = (
                question_map.get(
                    question_key
                )
            )

            # =================================================
            # UPDATE EXISTING QUESTION
            # =================================================

            if existing_question:

                question_changed = False

                # ---------------------------------------------
                # TOPIC
                # ---------------------------------------------

                if (
                    existing_question.topic
                    != topic
                ):

                    existing_question.topic = (
                        topic
                    )

                    question_changed = True

                # ---------------------------------------------
                # DIFFICULTY
                # ---------------------------------------------

                if (
                    existing_question.difficulty
                    != difficulty
                ):

                    existing_question.difficulty = (
                        difficulty
                    )

                    question_changed = True

                # ---------------------------------------------
                # MARKS
                # ---------------------------------------------

                if (
                    existing_question.marks
                    != marks
                ):

                    existing_question.marks = (
                        marks
                    )

                    question_changed = True

                # ---------------------------------------------
                # EXPLANATION
                # ---------------------------------------------

                new_explanation = (
                    explanation or None
                )

                if (
                    existing_question.explanation
                    != new_explanation
                ):

                    existing_question.explanation = (
                        new_explanation
                    )

                    question_changed = True

                # ---------------------------------------------
                # OPTIONS
                # ---------------------------------------------

                existing_options = list(
                    existing_question.options
                )

                existing_option_texts = [
                    option.option_text.strip()
                    for option
                    in existing_options
                ]

                incoming_option_texts = [
                    option_a,
                    option_b,
                    option_c,
                    option_d,
                ]

                options_changed = (
                    existing_option_texts
                    != incoming_option_texts
                )

                # ---------------------------------------------
                # REBUILD OPTIONS
                # ---------------------------------------------

                if options_changed:

                    for option in existing_options:
                        db.delete(option)

                    for key, option_text in (
                        options.items()
                    ):

                        db.add(
                            Option(
                                question_id=(
                                    existing_question.id
                                ),
                                option_text=(
                                    option_text
                                ),
                                is_correct=(
                                    key
                                    == correct_option
                                ),
                            )
                        )

                    question_changed = True

                else:

                    # -----------------------------------------
                    # ONLY CORRECT ANSWER CHANGED
                    # -----------------------------------------

                    for index, option in enumerate(
                        existing_options
                    ):

                        option_key = chr(
                            ord("A") + index
                        )

                        should_be_correct = (
                            option_key
                            == correct_option
                        )

                        if (
                            option.is_correct
                            != should_be_correct
                        ):

                            option.is_correct = (
                                should_be_correct
                            )

                            question_changed = True

                # ---------------------------------------------
                # COUNT
                # ---------------------------------------------

                if question_changed:
                    updated_count += 1
                else:
                    skipped_count += 1

                continue

            # =================================================
            # CREATE NEW QUESTION
            # =================================================

            question = Question(
                skill_id=skill.id,
                topic=topic,
                question_text=question_text,
                difficulty=difficulty,
                marks=marks,
                explanation=(
                    explanation
                    or None
                ),
                is_active=True,
            )

            # -------------------------------------------------
            # ADD OPTIONS
            # -------------------------------------------------

            for key, option_text in (
                options.items()
            ):

                question.options.append(
                    Option(
                        option_text=option_text,
                        is_correct=(
                            key
                            == correct_option
                        ),
                    )
                )

            db.add(question)

            # -------------------------------------------------
            # ADD TO MAP
            # -------------------------------------------------

            question_map[
                question_key
            ] = question

            created_count += 1

        # ====================================================
        # ROW ERROR
        # ====================================================

        except Exception as exc:

            failed_count += 1

            errors.append(
                {
                    "row": row_number,
                    "error": str(exc),
                }
            )

    # ========================================================
    # COMMIT EVERYTHING ONCE
    # ========================================================

    try:

        db.commit()

    except Exception as exc:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to import questions: "
                + str(exc)
            ),
        )

    # ========================================================
    # RESPONSE
    # ========================================================

    return {
        "message": (
            "Question bank imported successfully."
        ),
        "rows_processed": len(rows),
        "created": created_count,
        "updated": updated_count,
        "skipped": skipped_count,
        "failed": failed_count,
        "errors": errors,
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