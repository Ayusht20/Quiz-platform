import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";

import ProtectedRoute from "./components/ProtectedRoute";

// Auth
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

// Student
import Dashboard from "./pages/student/Dashboard";
import Practice from "./pages/student/Practice";
import Battle from "./pages/student/Battle";

// Admin
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/Dashboard";
import Assessments from "./pages/admin/Assessments";
import CreateAssessment from "./pages/admin/CreateAssessment";
import Questions from "./pages/admin/Questions";
import QuestionEditor from "./pages/admin/QuestionEditor";

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>

          <Routes>

            {/* ================================================= */}
            {/* ROOT */}
            {/* ================================================= */}

            <Route
              path="/"
              element={
                <Navigate
                  to="/dashboard"
                  replace
                />
              }
            />


            {/* ================================================= */}
            {/* AUTH */}
            {/* ================================================= */}

            <Route
              path="/login"
              element={<Login />}
            />

            <Route
              path="/register"
              element={<Register />}
            />


            {/* ================================================= */}
            {/* STUDENT ROUTES */}
            {/* ================================================= */}

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute role="STUDENT">
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/practice"
              element={
                <ProtectedRoute role="STUDENT">
                  <Practice />
                </ProtectedRoute>
              }
            />

            <Route
              path="/practice/:assessmentId"
              element={
                <ProtectedRoute role="STUDENT">
                  <Battle />
                </ProtectedRoute>
              }
            />


            {/* ================================================= */}
            {/* ADMIN ROUTES */}
            {/* ================================================= */}

            <Route
              path="/admin"
              element={
                <ProtectedRoute role="ADMIN">
                  <AdminLayout />
                </ProtectedRoute>
              }
            >

              {/* /admin → /admin/dashboard */}

              <Route
                index
                element={
                  <Navigate
                    to="/admin/dashboard"
                    replace
                  />
                }
              />


              {/* ADMIN DASHBOARD */}

              <Route
                path="dashboard"
                element={
                  <AdminDashboard />
                }
              />


              {/* QUESTION BANK */}

              <Route
                path="questions"
                element={
                  <Questions />
                }
              />
              <Route
  path="questions/create"
  element={
    <QuestionEditor />
  }
/>

              {/* BATTLES / ASSESSMENTS */}

              <Route
                path="assessments"
                element={
                  <Assessments />
                }
              />


              {/* CREATE BATTLE */}

              <Route
                path="assessments/create"
                element={
                  <CreateAssessment />
                }
              />

            </Route>


            {/* ================================================= */}
            {/* FALLBACK */}
            {/* ================================================= */}

            <Route
              path="*"
              element={
                <Navigate
                  to="/dashboard"
                  replace
                />
              }
            />

          </Routes>

        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;