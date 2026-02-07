import { useEffect, useMemo, useState } from "react";
import { auth } from "../firebase";

import {
  getTasksByOrganization,
  getTasksByEmployee,
  getEmployeesByOrganization,
} from "../services/taskService";

import { getAllOrganizations } from "../services/organizationService";

/* =========================
   PURE HELPERS (STABLE)
========================= */

const toDate = (d) =>
  typeof d?.toDate === "function" ? d.toDate() : d ? new Date(d) : null;

const isOverdue = (task) => {
  if (!task.deadline || task.status === "Done") return false;
  const d = toDate(task.deadline);
  return d && d < new Date();
};

const buildMonthlySeries = (tasks, field) => {
  const map = {};

  tasks.forEach((t) => {
    if (!t[field]) return;
    const d = toDate(t[field]);
    if (!d) return;

    const key = `${d.getFullYear()}-${String(
      d.getMonth() + 1
    ).padStart(2, "0")}`;

    map[key] = (map[key] || 0) + 1;
  });

  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6);
};

/* =========================
   ANALYTICS PAGE
========================= */

function AnalyticsPage({ role, organizationId, currentUser }) {
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  /* =========================
     DATA LOADING
  ========================= */

  useEffect(() => {
    const loadAnalytics = async () => {
      setLoading(true);

      try {
        // 🔴 SUPER ADMIN → ALL ORGS
        if (role === "super_admin") {
          const orgs = await getAllOrganizations();

          let allTasks = [];
          let allEmployees = [];

          for (const org of orgs) {
            const orgTasks = await getTasksByOrganization(org.id);
            const orgEmployees = await getEmployeesByOrganization(org.id);

            allTasks = allTasks.concat(orgTasks || []);
            allEmployees = allEmployees.concat(orgEmployees || []);
          }

          setTasks(allTasks);
          setEmployees(allEmployees);
        }

        // 🟦 ADMIN → SINGLE ORG
        else if (role === "admin" && organizationId) {
          const [taskData, employeeData] = await Promise.all([
            getTasksByOrganization(organizationId),
            getEmployeesByOrganization(organizationId),
          ]);

          setTasks(taskData || []);
          setEmployees(employeeData || []);
        }

        // 🟩 EMPLOYEE → OWN TASKS ONLY
        else if (role === "employee" && auth.currentUser) {
          const taskData = await getTasksByEmployee(auth.currentUser.uid);
          setTasks(taskData || []);
          setEmployees([]);
        }
      } catch (err) {
        console.error("Failed to load analytics:", err);
      }

      setLoading(false);
    };

    loadAnalytics();
  }, [role, organizationId]);

  /* =========================
     METRICS
  ========================= */

  const metrics = useMemo(() => ({
    total: tasks.length,
    pending: tasks.filter((t) => t.status !== "Done").length,
    completed: tasks.filter((t) => t.status === "Done").length,
    overdue: tasks.filter((t) => isOverdue(t)).length,
  }), [tasks]);

  const createdMonthly = useMemo(
    () => buildMonthlySeries(tasks, "createdAt"),
    [tasks]
  );

  const completedMonthly = useMemo(
    () => buildMonthlySeries(tasks, "completedAt"),
    [tasks]
  );

  /* =========================
     RENDER
  ========================= */

  if (loading) {
    return <div style={{ padding: 40 }}>Loading analytics…</div>;
  }

  const displayName =
    currentUser?.name || currentUser?.email || "User";

  return (
    <div style={{ padding: 40 }}>
      <h1>Analytics</h1>
      <p>Welcome, {displayName}</p>

      {/* METRICS */}
      <div style={{ marginTop: 24 }}>
        <p><strong>Total Tasks:</strong> {metrics.total}</p>
        <p><strong>Pending:</strong> {metrics.pending}</p>
        <p><strong>Completed:</strong> {metrics.completed}</p>
        <p><strong>Overdue:</strong> {metrics.overdue}</p>
      </div>

      {/* MONTHLY SERIES (LOGIC READY FOR CHARTS) */}
      <div style={{ marginTop: 32 }}>
        <h3>Task Creation (Last 6 Months)</h3>
        {createdMonthly.map(([month, count]) => (
          <div key={month}>{month}: {count}</div>
        ))}
      </div>

      <div style={{ marginTop: 24 }}>
        <h3>Task Completion (Last 6 Months)</h3>
        {completedMonthly.map(([month, count]) => (
          <div key={month}>{month}: {count}</div>
        ))}
      </div>

      {/* TEAM WORKLOAD */}
      {(role === "admin" || role === "super_admin") && (
        <div style={{ marginTop: 32 }}>
          <h3>Team Workload</h3>

          {employees.map((e) => {
            const count = tasks.filter(
              (t) => t.assignedTo === e.uid
            ).length;

            return (
              <div key={e.uid}>
                {e.name || e.email}: {count} tasks
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default AnalyticsPage;
