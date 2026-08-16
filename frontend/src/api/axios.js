import axios from "axios";
import { API_BASE_URL } from "../config/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});


// ============================================================
// REQUEST INTERCEPTOR
// ============================================================

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");

    if (token) {
      config.headers = config.headers || {};

      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);


// ============================================================
// RESPONSE INTERCEPTOR
// ============================================================

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    /*
     * IMPORTANT:
     * Do NOT automatically remove the token here.
     *
     * A single 401 should not immediately destroy
     * the user's login session.
     */

    return Promise.reject(error);
  }
);


export default api;