import api from "../api/axios";

export const getAllQuests = async () => {
  const response = await api.get("/quests/admin");

  return response.data;
};

export const createQuest = async (data) => {
  const response = await api.post(
    "/quests/admin",
    data
  );

  return response.data;
};

export const updateQuest = async (
  questId,
  data
) => {
  const response = await api.patch(
    `/quests/admin/${questId}`,
    data
  );

  return response.data;
};

export const deleteQuest = async (
  questId
) => {
  const response = await api.delete(
    `/quests/admin/${questId}`
  );

  return response.data;
};