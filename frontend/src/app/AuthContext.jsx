import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { apiRequest } from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token") || "");
  const [username, setUsername] = useState(
    () => localStorage.getItem("username") || "teacher",
  );

  const signIn = useCallback(async (credentials) => {
    const body = new URLSearchParams(credentials);
    const result = await apiRequest("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    localStorage.setItem("token", result.access_token);
    localStorage.setItem("username", result.username);
    setToken(result.access_token);
    setUsername(result.username);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    setToken("");
    setUsername("teacher");
  }, []);

  const value = useMemo(
    () => ({ token, username, signIn, logout }),
    [token, username, signIn, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
