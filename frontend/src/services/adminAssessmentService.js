import api from "../api/axios";

export const createAssessment = async (data) => {
  const response = await api.post(
    "/assessments",
    data
  );

  return response.data;
};

export const getAllAssessments = async () => {
  const response = await api.get(
    "/assessments/admin/all"
  );

  return response.data;
};

export const createQuestion = async (data) => {
  const response = await api.post(
    "/questions",
    data
  );

  return response.data;
};

export const getSkills = async () => {
  const response = await api.get(
    "/skills"
  );

  return response.data;
};

export const addQuestionToAssessment = async (
  assessmentId,
  data
) => {
  const response = await api.post(
    `/assessments/${assessmentId}/questions`,
    data
  );

  return response.data;
};

export const publishAssessment = async (
  assessmentId
) => {
  const response = await api.patch(
    `/assessments/${assessmentId}/publish`
  );

  return response.data;
};

export const getQuestions = async ({
  skillId,
  difficulty,
} = {}) => {
  const params = {};

  if (skillId) {
    params.skill_id = skillId;
  }

  if (difficulty) {
    params.difficulty = difficulty;
  }

  const response = await api.get(
    "/questions",
    { params }
  );

  return response.data;
};


export const getQuestion = async (
  questionId
) => {
  const response = await api.get(
    `/questions/${questionId}`
  );

  return response.data;
};


export const deleteQuestion = async (
  questionId
) => {
  await api.delete(
    `/questions/${questionId}`
  );
};