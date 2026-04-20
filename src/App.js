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
import DangerZonePage from "./pages/DangerZonePage";
import EmployeeTaskViewer from "./pages/EmployeeTaskViewer";

/* =====================
   ROLE NORMALIZER
===================== */
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
  const [authError, setAuthError] = useState("");

  const PORTAL_MODE = process.env.REACT_APP_PORTAL_MODE;

  /* =====================
     AUTH FLOW
  ===================== */
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

        /* deleted user block */
        if (profile.status === "Deleted") {
          setAuthError("Account does not exist.");
          await signOut(auth);
          setUser(null);
          setRole(null);
          setLoading(false);
          return;
        }

        const normalizedRole = normalizeRole(profile.role);
        if (!normalizedRole) throw new Error("Invalid role");

        let orgStatus = "active";
        let organizationName = null;

        /* fetch org */
        if (profile.organizationId) {
          const org = await getOrganizationById(profile.organizationId);

          orgStatus = org?.status || "active";

          if (org?.name && typeof org.name === "string") {
            organizationName = org.name.trim();
          }
        }

        setUser({
          uid: firebaseUser.uid,
          ...profile,
          orgStatus,
          organizationName,
        });

        setRole(normalizedRole);
        setAuthError("");

      } catch (err) {
        console.error("Auth error:", err);
        setUser(null);
        setRole(null);
        await signOut(auth);
      }

      setLoading(false);
    });

    return () => unsub();
  }, []);

  /* =====================
     GUARDS
  ===================== */
  if (loading) return <div style={{ padding: 40 }}>Loading…</div>;

  if (!user || !role) {
    return <LoginPage authError={authError} />;
  }

  if (PORTAL_MODE === "super" && role !== "super_admin") {
    return <AccessDeniedPage />;
  }

  if (PORTAL_MODE === "app" && role === "super_admin") {
    return <AccessDeniedPage />;
  }

  if (
    role !== "super_admin" &&
    user.organizationId &&
    user.orgStatus === "disabled"
  ) {
    return <OrganizationDisabledPage />;
  }

  /* =====================
     DASHBOARD ROUTING
  ===================== */
  const DashboardByRole = () => {
    if (role === "super_admin") {
      return <SuperAdminDashboard currentUser={user} />;
    }

    if (role === "admin") {
      return (
        <AdminDashboard
          organizationId={user.organizationId}
          organizationName={user.organizationName}
          currentUser={user}
        />
      );
    }

    return <Navigate to="/tasks" replace />;
  };

  /* =====================
     APP ROUTES
  ===================== */
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
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/organizations" element={<OrganizationsPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/danger" element={<DangerZonePage currentUser={user} />} />
            <Route path="/test-tasks" element={<EmployeeTaskViewer currentUser={user} />} />
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

        {/* ADMIN */}
        {role === "admin" && (
          <>
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/employees" element={<UsersPage />} />
            <Route path="/danger" element={<DangerZonePage currentUser={user} />} />
            <Route path="/test-tasks" element={<EmployeeTaskViewer currentUser={user} />} />
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

        {/* EMPLOYEE */}
        {role === "employee" && (
          <>
            <Route
              path="/tasks"
              element={<EmployeeDashboard currentUser={user} />}
            />
            <Route path="/insights" element={<EmployeeInsightsPage />} />
          </>
        )}

        {/* COMMON */}
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </Layout>
  );
}

export default App;