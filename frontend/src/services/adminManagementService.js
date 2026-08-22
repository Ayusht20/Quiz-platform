import api from "../api/axios";

// ============================================================
// USERS
// ============================================================

export const getAdminUsers = async () => {
  const response = await api.get(
    "/admin/users"
  );

  return response.data;
};


// ============================================================
// SKILLS
// ============================================================

export const getAdminSkills = async () => {
  const response = await api.get(
    "/admin/skills"
  );

  return response.data;
};


// ============================================================
// ANALYTICS
// ============================================================

export const getAdminAnalytics = async () => {
  const response = await api.get(
    "/admin/analytics"
  );

  return response.data;
};