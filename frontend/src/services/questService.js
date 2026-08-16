import api from "../api/axios";

export const getMyQuests = async () => {
  const response = await api.get("/quests");

  return response.data;
};