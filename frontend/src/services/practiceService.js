import api from "../api/axios";

// ============================================================
// GET PRACTICE TOPICS
//
// Skill + Difficulty
//      ↓
// Only topics that actually have questions
// ============================================================

export const getPracticeTopics = async (
  skillId,
  difficulty
) => {
  if (!skillId || !difficulty) {
    return [];
  }

  const response = await api.get(
    "/practice/topics",
    {
      params: {
        skill_id: skillId,
        difficulty,
      },
    }
  );

  return response.data;
};


// ============================================================
// GET PRACTICE QUESTIONS
//
// Skill + Difficulty + Topic
// ============================================================

export const getPracticeQuestions = async ({
  skillId,
  topic,
  difficulty,
  limit = 10,
} = {}) => {

  const params = {
    limit,
  };

  if (skillId) {
    params.skill_id = skillId;
  }

  if (difficulty) {
    params.difficulty = difficulty;
  }

  if (topic) {
    params.topic = topic;
  }

  const response = await api.get(
    "/practice/questions",
    {
      params,
    }
  );

  return response.data;
};


// ============================================================
// CHECK PRACTICE ANSWER
// ============================================================

export const checkPracticeAnswer = async (
  questionId,
  optionId
) => {

  const response = await api.post(
    "/practice/check",
    {
      question_id: questionId,
      option_id: optionId,
    }
  );

  return response.data;
};