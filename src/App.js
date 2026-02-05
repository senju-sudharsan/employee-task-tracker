import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";

import { auth } from "./firebase";
import { getUserProfile } from "./services/authService";
import { getAllTasks } from "./services/taskService";
import { getOrganizationById } from "./services/organizationService";

import Layout from "./components/Layout";
import LoginPage from "./pages/LoginPage";
import OrganizationDisabledPage from "./pages/OrganizationDisabledPage";

import SuperAdminDashboard from "./components/SuperAdminDashboard";
import AdminDashboard from "./components/AdminDashboard";
import EmployeeDashboard from "./components/EmployeeDashboard";

import TasksPage from "./pages/TasksPage";
import OrganizationsPage from "./pages/OrganizationsPage";
import UsersPage from "./pages/UsersPage";
import EmployeeInsightsPage from "./pages/EmployeeInsightsPage";
import SettingsPage from "./pages/SettingsPage";

/* ===========================
   ROLE NORMALIZER
=========================== */
function normalizeRole(rawRole) {
  if (!rawRole) return null;

  const r = rawRole.toLowerCase().trim();
  if (r === "superadmin" || r === "super_admin") return "super_admin";
  if (r === "admin") return "admin";
  if (r === "employee") return "employee";
  return null;
}

function App() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);

      if (!firebaseUser) {
        setUser(null);
        setRole(null);
        setTasks([]);
        setLoading(false);
        return;
      }

      try {
        // 1️⃣ Load Firestore profile
        const profile = await getUserProfile(firebaseUser.uid);
        const normalizedRole = normalizeRole(profile.role);

        if (!normalizedRole) {
          console.error("Invalid role:", profile.role);
          await signOut(auth);
          return;
        }

        // 2️⃣ Resolve organization status (ONLY if org exists)
        let orgStatus = "active";

        if (profile.organizationId) {
          const org = await getOrganizationById(profile.organizationId);

          // If org missing → do NOT hard lock user
          if (org && org.status) {
            orgStatus = org.status;
          }
        }

        // 3️⃣ Set global user state
        setUser({
          uid: firebaseUser.uid,
          ...profile,
          orgStatus
        });

        setRole(normalizedRole);

        // 4️⃣ Tasks (used by dashboards)
        const allTasks = await getAllTasks();
        setTasks(allTasks || []);
      } catch (err) {
        console.error("Auth bootstrap failed:", err);
        await signOut(auth);
      }

      setLoading(false);
    });

    return () => unsub();
  }, []);

  /* ===========================
     GUARDS
  =========================== */

  if (loading) {
    return <div style={{ padding: 40 }}>Loading…</div>;
  }

  if (!user || !role) {
    return <LoginPage />;
  }

  // 🚨 BLOCK ONLY ADMIN + EMPLOYEE WHEN ORG DISABLED
  if (
    role !== "super_admin" &&
    user.organizationId &&
    user.orgStatus === "disabled"
  ) {
    return <OrganizationDisabledPage />;
  }

  /* ===========================
     DASHBOARD ROUTER
  =========================== */
  const DashboardByRole = () => {
    if (role === "super_admin") {
      return <SuperAdminDashboard tasks={tasks} />;
    }

    if (role === "admin") {
      return (
        <AdminDashboard
          organizationId={user.organizationId}
          adminUid={user.uid}
        />
      );
    }

    return <Navigate to="/tasks" replace />;
  };

  /* ===========================
     ROUTES
  =========================== */
  return (
    <Layout role={role} onLogout={() => signOut(auth)}>
      <Routes>
        {/* ROOT */}
        <Route
          path="/"
          element={
            role === "employee"
              ? <Navigate to="/tasks" replace />
              : <Navigate to="/dashboard" replace />
          }
        />

        {/* DASHBOARD */}
        <Route
          path="/dashboard"
          element={
            role === "employee"
              ? <Navigate to="/tasks" replace />
              : <DashboardByRole />
          }
        />

        {/* SUPER ADMIN */}
        {role === "super_admin" && (
          <>
            <Route path="/organizations" element={<OrganizationsPage />} />
            <Route
              path="/users"
              element={
                <UsersPage organizationId={null} />
              }
            />
          </>
        )}

        {/* ADMIN */}
        {role === "admin" && (
          <>
            <Route path="/tasks" element={<TasksPage />} />
            <Route
              path="/employees"
              element={
                <UsersPage organizationId={user.organizationId} />
              }
            />
          </>
        )}

        {/* EMPLOYEE */}
        {role === "employee" && (
          <>
            <Route path="/tasks" element={<EmployeeDashboard />} />
            <Route path="/insights" element={<EmployeeInsightsPage />} />
          </>
        )}

        {/* SHARED */}
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default App;
