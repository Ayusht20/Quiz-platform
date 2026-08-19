import api from "../api/axios";

// ============================================================
// GET PRACTICE TOPICS
// ============================================================

export const getPracticeTopics = async (skillId) => {
  if (!skillId) {
    return [];
  }

  const response = await api.get(
    "/practice/topics",
    {
      params: {
        skill_id: skillId,
      },
    }
  );

  return response.data;
};


// ============================================================
// GET PRACTICE QUESTIONS
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

  if (topic) {
    params.topic = topic;
  }

  if (difficulty) {
    params.difficulty = difficulty;
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