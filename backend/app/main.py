from fastapi import FastAPI
from sqlalchemy import text
import app.models
from app.api.routes.auth import router as auth_router
from app.db.database import engine
app= FastAPI(
    title="SkillArena API",
    description="Gamefied Skill Assessment Platform",
)
app.include_router(
    auth_router,
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