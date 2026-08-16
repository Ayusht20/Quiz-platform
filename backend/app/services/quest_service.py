from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.quest import Quest
from app.models.user import User
from app.models.user_quest import UserQuest

from app.services.xp_service import award_xp


# ============================================================
# GET OR CREATE USER QUEST
# ============================================================

def get_or_create_user_quest(
    db: Session,
    user: User,
    quest: Quest,
) -> UserQuest:

    user_quest = db.scalar(
        select(UserQuest).where(
            UserQuest.user_id == user.id,
            UserQuest.quest_id == quest.id,
        )
    )

    if user_quest:
        return user_quest

    user_quest = UserQuest(
        user_id=user.id,
        quest_id=quest.id,
        progress=0,
        completed=False,
        reward_claimed=False,
    )

    db.add(user_quest)
    db.flush()

    return user_quest


# ============================================================
# UPDATE GENERIC QUEST PROGRESS
# ============================================================

def update_quest_progress(
    db: Session,
    user: User,
    target_type: str,
    amount: int = 1,
):
    """
    Update all active quests matching target_type.

    Supported target types currently handled here:

        BATTLES
        QUESTIONS
        CORRECT_ANSWERS
        PASSED_BATTLES
        PERFECT_BATTLES

    Example:

        update_quest_progress(
            db=db,
            user=user,
            target_type="BATTLES",
            amount=1,
        )
    """

    if amount <= 0:
        return []

    target_type = target_type.upper()

    now = datetime.now(timezone.utc)

    quests = db.scalars(
        select(Quest).where(
            Quest.is_active.is_(True),

            Quest.target_type == target_type,

            (
                Quest.starts_at.is_(None)
                | (Quest.starts_at <= now)
            ),

            (
                Quest.ends_at.is_(None)
                | (Quest.ends_at >= now)
            ),
        )
    ).all()

    completed_quests = []

    for quest in quests:

        user_quest = get_or_create_user_quest(
            db=db,
            user=user,
            quest=quest,
        )

        # ----------------------------------------------------
        # Already completed
        # ----------------------------------------------------

        if user_quest.completed:
            continue

        # ----------------------------------------------------
        # Add progress
        # ----------------------------------------------------

        user_quest.progress += amount

        # ----------------------------------------------------
        # Prevent progress from exceeding target
        # ----------------------------------------------------

        if user_quest.progress >= quest.target_value:

            user_quest.progress = quest.target_value

            user_quest.completed = True

            user_quest.completed_at = now

            # ------------------------------------------------
            # Reward exactly once
            # ------------------------------------------------

            if not user_quest.reward_claimed:

                award_xp(
                    db=db,
                    user=user,
                    amount=quest.reward_xp,
                    reason=(
                        f"Quest completed: "
                        f"{quest.title}"
                    ),
                )

                user_quest.reward_claimed = True

                completed_quests.append(
                    {
                        "quest_id": quest.id,
                        "title": quest.title,
                        "reward_xp": quest.reward_xp,
                    }
                )

    return completed_quests


# ============================================================
# BATTLE QUESTS
# ============================================================

def update_battle_quests(
    db: Session,
    user: User,
    *,
    passed: bool = False,
    perfect: bool = False,
):
    """
    Update battle-related quests after a battle submission.

    Every completed battle:
        BATTLES +1

    If the student passed:
        PASSED_BATTLES +1

    If the student achieved a perfect score:
        PERFECT_BATTLES +1
    """

    completed_quests = []

    # --------------------------------------------------------
    # COMPLETED BATTLE
    # --------------------------------------------------------

    completed_quests.extend(
        update_quest_progress(
            db=db,
            user=user,
            target_type="BATTLES",
            amount=1,
        )
    )

    # --------------------------------------------------------
    # PASSED BATTLE
    # --------------------------------------------------------

    if passed:

        completed_quests.extend(
            update_quest_progress(
                db=db,
                user=user,
                target_type="PASSED_BATTLES",
                amount=1,
            )
        )

    # --------------------------------------------------------
    # PERFECT BATTLE
    # --------------------------------------------------------

    if perfect:

        completed_quests.extend(
            update_quest_progress(
                db=db,
                user=user,
                target_type="PERFECT_BATTLES",
                amount=1,
            )
        )

    return completed_quests


# ============================================================
# QUESTION QUESTS
# ============================================================

def update_question_quests(
    db: Session,
    user: User,
    questions_answered: int,
    correct_answers: int,
):
    """
    Updates question-based quests after
    a battle submission.
    """

    completed_quests = []

    # --------------------------------------------------------
    # QUESTIONS ANSWERED
    # --------------------------------------------------------

    if questions_answered > 0:

        completed_quests.extend(
            update_quest_progress(
                db=db,
                user=user,
                target_type="QUESTIONS",
                amount=questions_answered,
            )
        )

    # --------------------------------------------------------
    # CORRECT ANSWERS
    # --------------------------------------------------------

    if correct_answers > 0:

        completed_quests.extend(
            update_quest_progress(
                db=db,
                user=user,
                target_type="CORRECT_ANSWERS",
                amount=correct_answers,
            )
        )

    return completed_quests


# ============================================================
# SKILL QUESTS
# ============================================================

def update_skill_quests(
    db: Session,
    user: User,
    *,
    completed_skill: bool = False,
    mastered_skill: bool = False,
):
    """
    Update skill-related quests.

    COMPLETE_SKILL:
        Triggered when a student completes a skill.

    MASTERED_SKILL:
        Triggered when a student reaches mastery
        for a skill.
    """

    completed_quests = []

    # --------------------------------------------------------
    # COMPLETED SKILL
    # --------------------------------------------------------

    if completed_skill:

        completed_quests.extend(
            update_quest_progress(
                db=db,
                user=user,
                target_type="COMPLETED_SKILLS",
                amount=1,
            )
        )

    # --------------------------------------------------------
    # MASTERED SKILL
    # --------------------------------------------------------

    if mastered_skill:

        completed_quests.extend(
            update_quest_progress(
                db=db,
                user=user,
                target_type="MASTERED_SKILLS",
                amount=1,
            )
        )

    return completed_quests