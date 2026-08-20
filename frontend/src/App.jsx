import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";

import ProtectedRoute from "./components/ProtectedRoute";

// ============================================================
// AUTH
// ============================================================

import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

// ============================================================
// STUDENT
// ============================================================

import Dashboard from "./pages/student/Dashboard";
import Practice from "./pages/student/Practice";
import Battle from "./pages/student/Battle";
import SkillTree from "./pages/student/SkillTree";
import Quests from "./pages/student/Quests";
import Achievements from "./pages/student/Achievements";

// ============================================================
// ADMIN
// ============================================================

import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/Dashboard";



import Questions from "./pages/admin/Questions";
import QuestionEditor from "./pages/admin/QuestionEditor";

import AdminQuests from "./pages/admin/Quests";
import CreateQuest from "./pages/admin/CreateQuest";


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

            {/* DASHBOARD */}

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute role="STUDENT">
                  <Dashboard />
                </ProtectedRoute>
              }
            />


            {/* PRACTICE / BATTLES */}

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


            {/* SKILL TREE */}

            <Route
              path="/skills"
              element={
                <ProtectedRoute role="STUDENT">
                  <SkillTree />
                </ProtectedRoute>
              }
            />


            {/* QUESTS */}

            <Route
              path="/quests"
              element={
                <ProtectedRoute role="STUDENT">
                  <Quests />
                </ProtectedRoute>
              }
            />
<Route
  path="/badges"
  element={
    <ProtectedRoute role="STUDENT">
      <Achievements />
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

              {/* =============================================== */}
              {/* ADMIN ROOT */}
              {/* =============================================== */}

              <Route
                index
                element={
                  <Navigate
                    to="/admin/dashboard"
                    replace
                  />
                }
              />


              {/* =============================================== */}
              {/* ADMIN DASHBOARD */}
              {/* =============================================== */}

              <Route
                path="dashboard"
                element={
                  <AdminDashboard />
                }
              />


              {/* =============================================== */}
              {/* QUESTION BANK */}
              {/* =============================================== */}

              <Route
                path="questions"
                element={
                  <Questions />
                }
              />


              {/* CREATE QUESTION */}

              <Route
                path="questions/create"
                element={
                  <QuestionEditor />
                }
              />

              {/* =============================================== */}
              {/* QUEST MANAGEMENT */}
              {/* =============================================== */}

              <Route
                path="quests"
                element={
                  <AdminQuests />
                }
              />


              {/* CREATE QUEST */}

              <Route
                path="quests/create"
                element={
                  <CreateQuest />
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