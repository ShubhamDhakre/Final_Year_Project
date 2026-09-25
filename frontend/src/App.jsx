import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import DashboardLayout from "./layout/DashboardLayout";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import HrInterviewPage from "./pages/HrInterviewPage";
import TechnicalInterviewPage from "./pages/TechnicalInterviewPage";
import ResumeAnalysisPage from "./pages/ResumeAnalysisPage";
import LoadingScreen from "./components/LoadingScreen";
import CursorGlow from "./components/CursorGlow";

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const App = () => {
  return (
    <>
      <CursorGlow />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route
          path="/"
          element={
            <PrivateRoute>
              <DashboardLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="resume-analyzer" element={<ResumeAnalysisPage />} />
          <Route path="hr-interview" element={<HrInterviewPage />} />
          <Route path="technical-interview" element={<TechnicalInterviewPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

export default App;
