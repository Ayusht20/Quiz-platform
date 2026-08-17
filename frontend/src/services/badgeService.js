import api from "../api/axios";


// ============================================================
// GET ALL BADGES
// ============================================================

export const getAllBadges = async () => {
  const response = await api.get("/badges");

  return response.data;
};


// ============================================================
// GET MY EARNED BADGES
// ============================================================

export const getMyBadges = async () => {
  const response = await api.get("/badges/me");

  return response.data;
};