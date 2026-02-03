import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";

import { auth } from "./firebase";
import { getUserProfile } from "./services/authService";
import { getAllTasks } from "./services/taskService";

import Layout from "./components/Layout";
import LoginPage from "./pages/LoginPage";

import SuperAdminDashboard from "./components/SuperAdminDashboard";
import AdminDashboard from "./components/AdminDashboard";
import EmployeeDashboard from "./components/EmployeeDashboard";

import TasksPage from "./pages/TasksPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import SettingsPage from "./pages/SettingsPage";

import OrganizationsPage from "./pages/OrganizationsPage";
import UsersPage from "./pages/UsersPage";

/* ===========================
   ROLE NORMALIZER
=========================== */
function normalizeRole(rawRole) {
  if (!rawRole) return null;

  const role = rawRole.toLowerCase().trim();

  if (role === "superadmin" || role === "super_admin") return "super_admin";
  if (role === "admin") return "admin";
  if (role === "employee") return "employee";

  return null;
}

function App() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ===========================
     AUTH BOOTSTRAP
  =========================== */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setRole(null);
        setTasks([]);
        setLoading(false);
        return;
      }

      const profile = await getUserProfile(firebaseUser.uid);
      const normalizedRole = normalizeRole(profile.role);

      const fullUser = {
        uid: firebaseUser.uid,
        ...profile
      };

      setUser(fullUser);
      setRole(normalizedRole);

      const allTasks = await getAllTasks();
      setTasks(allTasks || []);

      setLoading(false);
    });

    return () => unsub();
  }, []);

  /* ===========================
     LOGOUT
  =========================== */
  const handleLogout = async () => {
    await signOut(auth);
  };

  /* ===========================
     GUARDS
  =========================== */
  if (loading) {
    return <div style={{ padding: 40 }}>Loading...</div>;
  }

  if (!user) {
    return <LoginPage />;
  }

  /* ===========================
     DASHBOARD SWITCH (FIXED)
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

    if (role === "employee") {
      const myTasks = tasks.filter(
        (t) => t.assignedTo === user.uid
      );

      return (
        <EmployeeDashboard
          tasks={myTasks}
          refreshTasks={async () => {
            const updated = await getAllTasks();
            setTasks(updated || []);
          }}
        />
      );
    }

    return (
      <pre style={{ color: "red" }}>
        Unknown role: {JSON.stringify(role, null, 2)}
      </pre>
    );
  };

  /* ===========================
     ROUTES
  =========================== */
  return (
    <Layout role={role} onLogout={handleLogout}>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardByRole />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
        <Route path="/organizations" element={<OrganizationsPage />} />
        <Route path="/users" element={<UsersPage />} />

      </Routes>
    </Layout>
  );
}

export default App;
