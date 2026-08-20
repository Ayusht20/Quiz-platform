import api from "../api/axios";


// ============================================================
// GENERATE AUTOMATIC BATTLE
// ============================================================

export const generateBattle = async ({
  skillId,
  topic,
  difficulty,
  questionCount = 10,
}) => {

  const response = await api.post(
    "/battles/generate",
    {
      skill_id: skillId,
      topic,
      difficulty,
      question_count: questionCount,
    }
  );

  return response.data;
};