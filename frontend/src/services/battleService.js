import api from "../api/axios";

// ============================================================
// GENERATE AUTOMATIC BATTLE
// ============================================================

export const generateBattle = async ({
  skillId,
  topic,
  difficulty,
  questionCount = 10,
  durationMinutes = 10,
}) => {
  const response = await api.post(
    "/battles/generate",
    {
      skill_id: skillId,
      topic: topic || null,
      difficulty,
      question_count: questionCount,
      duration_minutes: durationMinutes,
    }
  );

  return response.data;
};