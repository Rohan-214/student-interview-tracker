import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ApiError, apiRequest } from "./api";
import { useAuth } from "./AuthContext";

const TrackerContext = createContext(null);

const EMPTY_RESULTS = { selected_count: 0, selections: [] };

export function TrackerProvider({ children }) {
  const { token, logout } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [students, setStudents] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [results, setResults] = useState(EMPTY_RESULTS);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const request = useCallback(
    async (path, options = {}) => {
      try {
        return await apiRequest(path, { ...options, token });
      } catch (requestError) {
        if (requestError instanceof ApiError && requestError.status === 401) {
          logout();
          throw new ApiError("Your session expired. Please sign in again.", 401);
        }
        throw requestError;
      }
    },
    [token, logout],
  );

  const refresh = useCallback(async () => {
    if (!token) return;
    setError("");
    try {
      const [nextDashboard, nextStudents, nextInterviews, nextResults] =
        await Promise.all([
          request("/dashboard"),
          request("/students"),
          request("/interviews"),
          request("/results"),
        ]);
      setDashboard(nextDashboard);
      setStudents(nextStudents);
      setInterviews(nextInterviews);
      setResults(nextResults);
    } catch (refreshError) {
      setError(refreshError.message);
    }
  }, [request, token]);

  useEffect(() => {
    if (token) {
      refresh();
    } else {
      setDashboard(null);
      setStudents([]);
      setInterviews([]);
      setResults(EMPTY_RESULTS);
      setError("");
      setNotice("");
    }
  }, [token, refresh]);

  const value = useMemo(
    () => ({
      dashboard,
      students,
      interviews,
      results,
      error,
      notice,
      request,
      refresh,
      setError,
      setNotice,
      clearError: () => setError(""),
      clearNotice: () => setNotice(""),
    }),
    [dashboard, students, interviews, results, error, notice, request, refresh],
  );

  return (
    <TrackerContext.Provider value={value}>{children}</TrackerContext.Provider>
  );
}

export function useTracker() {
  const context = useContext(TrackerContext);
  if (!context) {
    throw new Error("useTracker must be used inside TrackerProvider");
  }
  return context;
}
