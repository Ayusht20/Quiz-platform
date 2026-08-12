from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


from app.models.user import User
from app.models.category import Category
from app.models.skill import Skill
from app.models.question import Question
from app.models.option import Option
from app.models.assessment import Assessment
from app.models.assessment_question import AssessmentQuestion