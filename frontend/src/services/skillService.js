import api from "../api/axios";

export const getMySkillProgress = async () => {
  const response = await api.get(
    "/skills/progress"
  );

  return response.data;
};