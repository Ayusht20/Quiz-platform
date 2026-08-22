from fastapi import FastAPI
from sqlalchemy import text
import app.models
from app.db.database import engine
from fastapi.middleware.cors import CORSMiddleware
app= FastAPI(
    title="SkillArena API",
    description="Gamefied Skill Assessment Platform",
)
from app.api.routes.auth import router as auth_router
from app.api.routes.users import router as users_router
from app.api.routes.admin import router as admin_router
from app.api.routes.categories import router as categories_router
from app.api.routes.skills import router as skills_router
from app.api.routes.questions import router as questions_router
from app.api.routes.assessments import router as assessments_router
from app.api.routes.leaderboard import router as leaderboard_router
from app.api.routes.attempts import router as attempts_router
from app.api.routes.quests import router as quests_router
from app.api.routes.badges import router as badges_router
from app.api.routes.practice import router as practice_router
from app.api.routes.battles import router as battles_router
from app.api.routes.admin_dashboard import (
    router as admin_dashboard_router,
)
from app.api.routes.admin_management import (
    router as admin_management_router,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://quiz-platform-amber-six.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(
    auth_router,
    prefix="/api",
)
app.include_router(
    admin_router,
    prefix="/api",
) 
 
app.include_router(
    users_router,
    prefix="/api",
)
app.include_router(
    categories_router,
    prefix="/api",
)

app.include_router(
    skills_router,
    prefix="/api",
)

app.include_router(
    questions_router,
    prefix="/api",
)
app.include_router(
    assessments_router,
    prefix="/api",
)
app.include_router(
    leaderboard_router,
    prefix="/api",
)
app.include_router(
    quests_router,
    prefix="/api",
)
app.include_router(
    badges_router,
    prefix="/api",
)

app.include_router(
    practice_router,
    prefix="/api",
)
app.include_router(attempts_router,prefix="/api")
app.include_router(admin_dashboard_router,prefix="/api")
app.include_router(admin_management_router,prefix="/api")
app.include_router(
    battles_router,
    prefix="/api",
)
@app.get("/")
def root():
    return {"message":"Welcome to SkillArena API!!"
            }


@app.get("/health")
def healthCheck():
    return {"status" : "healthyy!"}

@app.get("/health/database")
def database_health_check():
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))

    return {
        "database": "connected"
    }