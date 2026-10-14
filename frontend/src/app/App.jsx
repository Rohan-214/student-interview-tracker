import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "../components/AppLayout";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { DashboardPage } from "../features/dashboard/DashboardPage";
import { InterviewDetailsPage } from "../features/interviews/InterviewDetailsPage";
import { InterviewsPage } from "../features/interviews/InterviewsPage";
import { LoginPage } from "../features/login/LoginPage";
import { ResultsPage } from "../features/results/ResultsPage";
import { StudentHistoryPage } from "../features/students/StudentHistoryPage";
import { StudentsPage } from "../features/students/StudentsPage";

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/students" element={<StudentsPage />} />
          <Route
            path="/students/:studentId/history"
            element={<StudentHistoryPage />}
          />
          <Route path="/interviews" element={<InterviewsPage />} />
          <Route
            path="/interviews/:interviewId"
            element={<InterviewDetailsPage />}
          />
          <Route path="/results" element={<ResultsPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Route>
    </Routes>
  );
}
