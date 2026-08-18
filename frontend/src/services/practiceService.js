import api from "../api/axios";

export const getPracticeQuestions = async ({
  skillId,
  difficulty,
  limit = 10,
} = {}) => {
  const params = {};

  if (skillId) {
    params.skill_id = skillId;
  }

  if (difficulty) {
    params.difficulty = difficulty;
  }

  params.limit = limit;

  const response = await api.get(
    "/practice/questions",
    {
      params,
    }
  );

  return response.data;
};


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