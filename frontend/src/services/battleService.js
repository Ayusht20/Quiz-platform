import api from "../api/axios";

// ============================================================
// GENERATE AUTOMATIC BATTLE
//
// Student selects ONLY:
//
// Skill + Difficulty
//
// Topic is intentionally NOT sent.
// ============================================================

export const generateBattle = async ({
  skillId,
  difficulty,
  questionCount = 10,
  durationMinutes = 10,
}) => {
  const response = await api.post(
    "/battles/generate",
    {
      skill_id: skillId,
      difficulty,
      question_count: questionCount,
      duration_minutes: durationMinutes,
    }
  );

  return response.data;
};