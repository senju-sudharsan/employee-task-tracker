import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";

import { auth } from "./firebase";
import { getUserProfile } from "./services/authService";
import { getOrganizationById } from "./services/organizationService";

import Layout from "./components/Layout";
import LoginPage from "./pages/LoginPage";
import OrganizationDisabledPage from "./pages/OrganizationDisabledPage";
import AccessDeniedPage from "./pages/AccessDeniedPage";

import SuperAdminDashboard from "./components/SuperAdminDashboard";
import AdminDashboard from "./components/AdminDashboard";
import EmployeeDashboard from "./components/EmployeeDashboard";

import TasksPage from "./pages/TasksPage";
import OrganizationsPage from "./pages/OrganizationsPage";
import UsersPage from "./pages/UsersPage";
import EmployeeInsightsPage from "./pages/EmployeeInsightsPage";
import SettingsPage from "./pages/SettingsPage";
import AnalyticsPage from "./pages/AnalyticsPage";

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
  const [loading, setLoading] = useState(true);

  // 🔒 Portal mode (super | app)
  const PORTAL_MODE = process.env.REACT_APP_PORTAL_MODE;

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);

      if (!firebaseUser) {
        setUser(null);
        setRole(null);
        setLoading(false);
        return;
      }

      try {
        const profile = await getUserProfile(firebaseUser.uid);
        const normalizedRole = normalizeRole(profile.role);

        if (!normalizedRole) {
          await signOut(auth);
          return;
        }

        let orgStatus = "active";

        if (profile.organizationId) {
          const org = await getOrganizationById(profile.organizationId);
          if (org?.status) orgStatus = org.status;
        }

        setUser({
          uid: firebaseUser.uid,
          ...profile,
          orgStatus
        });

        setRole(normalizedRole);
      } catch {
        await signOut(auth);
      }

      setLoading(false);
    });

    return () => unsub();
  }, []);

  /* ===========================
     GLOBAL STATE HANDLING
  =========================== */

  if (loading) return <div style={{ padding: 40 }}>Loading…</div>;
  if (!user || !role) return <LoginPage />;

  /* ===========================
     🔐 PORTAL ISOLATION LOGIC
  =========================== */

  // Super portal → only super admins allowed
  if (PORTAL_MODE === "super" && role !== "super_admin") {
    return <AccessDeniedPage />;
  }

  // App portal → super admins blocked
  if (PORTAL_MODE === "app" && role === "super_admin") {
    return <AccessDeniedPage />;
  }

  /* ===========================
     ORG DISABLED CHECK
  =========================== */
  if (
    role !== "super_admin" &&
    user.organizationId &&
    user.orgStatus === "disabled"
  ) {
    return <OrganizationDisabledPage />;
  }

  /* ===========================
     DASHBOARD RESOLVER
  =========================== */
  const DashboardByRole = () => {
    if (role === "super_admin") {
      return <SuperAdminDashboard currentUser={user} />;
    }

    if (role === "admin") {
      return (
        <AdminDashboard
          organizationId={user.organizationId}
          currentUser={user}
        />
      );
    }

    return <Navigate to="/tasks" replace />;
  };

  /* ===========================
     ROUTING
  =========================== */
  return (
    <Layout role={role} onLogout={() => signOut(auth)}>
      <Routes>
        <Route
          path="/"
          element={
            role === "employee"
              ? <Navigate to="/tasks" replace />
              : <Navigate to="/dashboard" replace />
          }
        />

        <Route
          path="/dashboard"
          element={
            role === "employee"
              ? <Navigate to="/tasks" replace />
              : <DashboardByRole />
          }
        />

        {/* SUPER ADMIN ROUTES */}
        {role === "super_admin" && (
          <>
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/organizations" element={<OrganizationsPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route
              path="/analytics"
              element={
                <AnalyticsPage
                  role={role}
                  organizationId={null}
                  currentUser={user}
                />
              }
            />
          </>
        )}

        {/* ADMIN ROUTES */}
        {role === "admin" && (
          <>
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/employees" element={<UsersPage />} />
            <Route
              path="/analytics"
              element={
                <AnalyticsPage
                  role={role}
                  organizationId={user.organizationId}
                  currentUser={user}
                />
              }
            />
          </>
        )}

        {/* EMPLOYEE ROUTES */}
        {role === "employee" && (
          <>
            <Route
              path="/tasks"
              element={<EmployeeDashboard currentUser={user} />}
            />
            <Route path="/insights" element={<EmployeeInsightsPage />} />
          </>
        )}

        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default App;
