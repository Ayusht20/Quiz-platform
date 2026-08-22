# SkillArena

## Introduction

SkillArena is a gamified programming skill assessment platform designed to help students practice programming questions, participate in battles, complete quests, earn XP, and unlock achievements.

Students can practice questions based on skill, difficulty, and available topics. When they are ready, they can enter a battle where questions are automatically selected and randomized by the system.

Administrators can manage the question bank through CSV import and manage quests through the admin panel.

---

## Live Links

### Frontend
https://quiz-platform-amber-six.vercel.app

### Backend
https://quiz-platform-6743.onrender.com

### API Documentation
https://quiz-platform-6743.onrender.com/docs



---

## Screenshots with Navigation

### Student Dashboard

The student dashboard provides access to the main SkillArena features.

**Navigation:**
- Dashboard
- Practice / Battle
- Quests
- Skill Tree
- Leaderboard
- Achievements

### Practice

Students can:

1. Select a skill.
2. Select a difficulty level.
3. Select an available topic.
4. Practice questions.
5. Check answers and view explanations.

### Battle

Students can:

1. Select a skill.
2. Select a difficulty level.
3. Start an automatically generated battle.
4. Answer randomized questions.
5. Complete the battle within the given time.
6. Earn XP based on performance.

### Quests

Students can view active quests, track their progress, and earn XP rewards by completing them.

### Achievements

Students can view available badges and the badges they have earned.

### Admin Panel

Administrators can access:

- Dashboard
- Question Bank
- Quests
- Users
- Analytics

The Question Bank supports CSV-based question importing.

---

## Tech Stack

### Frontend

- React
- Vite
- React Router
- Axios
- Tailwind CSS
- Framer Motion
- Lucide React

### Backend

- Python
- FastAPI
- SQLAlchemy
- Pydantic
- JWT Authentication
- Alembic

### Database

- PostgreSQL
- Neon PostgreSQL

### Deployment

- Frontend: Vercel
- Backend: Render

---

## Folder Structure


SkillArena/
│
├── frontend/
│   └── src/
│       ├── api/
│       ├── components/
│       ├── context/
│       ├── pages/
│       │   ├── auth/
│       │   ├── student/
│       │   └── admin/
│       └── services/
│
└── backend/
    ├── app/
    │   ├── api/
    │   │   ├── routes/
    │   │   └── dependencies.py
    │   │
    │   ├── models/
    │   ├── schemas/
    │   ├── services/
    │   ├── core/
    │   └── db/
    │
    ├── alembic/
    └── requirements.txt


### Industrial Use

SkillArena can be used as a programming practice and assessment platform for:

Educational institutions
Programming training programs
Student skill development
Technical assessments
Practice-based learning environments

The combination of a structured question bank, automated battles, quests, XP, and achievements provides an engaging way to practice and evaluate programming skills.


### Conclusion

SkillArena combines programming practice with a gamified assessment experience.

Students can practice questions, participate in automatically generated battles, complete quests, earn XP, and unlock achievements, while administrators can manage the question bank and quests through a dedicated admin panel.

The project demonstrates a full-stack application built with React, FastAPI, PostgreSQL, authentication, APIs, and cloud deployment.