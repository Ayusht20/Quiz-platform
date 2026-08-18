import api from "../api/axios";

export const getAvailableSkills = async () => {
  const response = await api.get(
    "/skills/available"
  );

  return response.data;
};

export const getMySkillProgress = async () => {
  const response = await api.get(
    "/skills/progress"
  );

  return response.data;
};