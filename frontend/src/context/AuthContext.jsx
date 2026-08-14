import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import api from "../api/axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    const token =
      localStorage.getItem("access_token");

    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response =
        await api.get("/users/me");

      setUser(response.data);

    } catch (error) {
      console.error(
        "Failed to load current user:",
        error
      );

      /*
       * Only remove the token when the
       * backend explicitly says the token
       * is unauthorized.
       */

      if (
        error.response?.status === 401
      ) {
        localStorage.removeItem(
          "access_token"
        );

        setUser(null);
      }

    } finally {
      setLoading(false);
    }
  };


  const login = async (accessToken) => {
    localStorage.setItem(
      "access_token",
      accessToken
    );

    try {
      const response =
        await api.get("/users/me");

      setUser(response.data);

      return response.data;

    } catch (error) {

      /*
       * If login succeeded but /users/me
       * failed, don't silently leave the
       * application in a broken state.
       */

      localStorage.removeItem(
        "access_token"
      );

      setUser(null);

      throw error;
    }
  };


  const logout = () => {
    localStorage.removeItem(
      "access_token"
    );

    setUser(null);
  };


  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        refreshUser: loadCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}


export function useAuth() {
  return useContext(AuthContext);
}