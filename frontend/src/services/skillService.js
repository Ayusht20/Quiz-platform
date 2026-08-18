import api from "../api/axios";


// ============================================================
// GET AVAILABLE SKILLS FOR STUDENT
// ============================================================

export const getAvailableSkills = async () => {
  const response = await api.get(
    "/skills/available"
  );

  return response.data;
};


// ============================================================
// GET MY SKILL PROGRESS
// ============================================================

export const getMySkillProgress = async () => {
  const response = await api.get(
    "/skills/progress"
  );

  return response.data;
};