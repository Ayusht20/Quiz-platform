import api from "../api/axios";

export const getAssessments = async () => {
  const response = await api.get("/assessments");
  return response.data;
};

export const startAssessment = async (assessmentId) => {
  const response = await api.post(
    `/attempts/assessment/${assessmentId}/start`
  );

  return response.data;
};

export const getAttempt = async (attemptId) => {
  const response = await api.get(
    `/attempts/${attemptId}`
  );

  return response.data;
};

export const submitAttempt = async (
  attemptId,
  answers
) => {
  const response = await api.post(
    `/attempts/${attemptId}/submit`,
    {
      answers,
    }
  );

  return response.data;
};