from sqlalchemy.orm import Session

from app.models.level import Level


LEVELS = [
    (1, "Novice", 0),
    (2, "Beginner", 100),
    (3, "Learner", 250),
    (4, "Skilled", 500),
    (5, "Advanced", 1000),
    (6, "Expert", 2000),
    (7, "Master", 3500),
    (8, "Grandmaster", 5000),
    (9, "Legend", 7500),
    (10, "Champion", 10000),
]


def seed_levels(db: Session):
    for level_number, name, required_xp in LEVELS:
        existing = db.query(Level).filter(
            Level.level_number == level_number
        ).first()

        if not existing:
            db.add(
                Level(
                    level_number=level_number,
                    name=name,
                    required_xp=required_xp,
                )
            )

    db.commit()