import api from "../api/axios";


// ============================================================
// ASSESSMENTS
// ============================================================

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


export const getAssessment = async (
  assessmentId
) => {
  const response = await api.get(
    `/assessments/${assessmentId}`
  );

  return response.data;
};


// ============================================================
// SKILLS
// ============================================================

export const getSkills = async () => {
  const response = await api.get(
    "/skills"
  );

  return response.data;
};


// ============================================================
// TOPICS
// ============================================================

export const getAssessmentTopics = async (
  skillId
) => {
  const response = await api.get(
    `/assessments/available-topics/${skillId}`
  );

  return response.data;
};


// ============================================================
// AVAILABLE QUESTION COUNT
// ============================================================

export const getAvailableQuestionCount = async ({
  skillId,
  topic = "",
  difficulty = "",
}) => {

  const params = {
    skill_id: skillId,
  };

  if (topic) {
    params.topic = topic;
  }

  if (difficulty) {
    params.difficulty = difficulty;
  }

  const response = await api.get(
    "/assessments/available-count",
    {
      params,
    }
  );

  return response.data;
};


// ============================================================
// QUESTION BANK
// ============================================================

export const getQuestions = async ({
  skillId = "",
  difficulty = "",
  topic = "",
} = {}) => {

  const params = {};

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
    "/questions",
    {
      params,
    }
  );

  return response.data;
};


// ============================================================
// CREATE QUESTION
// ============================================================

export const createQuestion = async (
  data
) => {

  const response = await api.post(
    "/questions",
    data
  );

  return response.data;
};


// ============================================================
// MANUAL QUESTION ADDITION
// ============================================================

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


// ============================================================
// GET BATTLE QUESTIONS
// ============================================================

export const getAssessmentQuestions =
  async (assessmentId) => {

    const response = await api.get(
      `/assessments/${assessmentId}/questions`
    );

    return response.data;
  };


// ============================================================
// PUBLISH
//
// Backend automatically selects questions.
// ============================================================

export const publishAssessment = async (
  assessmentId
) => {

  const response = await api.patch(
    `/assessments/${assessmentId}/publish`
  );

  return response.data;
};