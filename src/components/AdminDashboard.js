import { useEffect, useState, useCallback } from "react";
import {
  getTasksByOrganization,
  createTask,
  getEmployeesByOrganization
} from "../services/taskService";

/**
 * Admin Dashboard
 * - Organization-wide overview
 * - Create tasks
 * - Read-only task monitoring
 * - Claude UI style
 * - Employees selectable by email (UID stored internally)
 */
function AdminDashboard({ organizationId, adminUid }) {
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [search, setSearch] = useState("");

  /* ===========================
     LOAD TASKS + EMPLOYEES
  =========================== */
  const loadData = useCallback(async () => {
    if (!organizationId) return;

    setLoading(true);

    const [taskData, employeeData] = await Promise.all([
      getTasksByOrganization(organizationId),
      getEmployeesByOrganization(organizationId)
    ]);

    setTasks(taskData || []);
    setEmployees(employeeData || []);
    setLoading(false);
  }, [organizationId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* ===========================
     CREATE TASK
  =========================== */
  const handleCreateTask = async () => {
    if (!title.trim() || !selectedEmployee) return;

    await createTask({
      title,
      organizationId,
      assignedTo: selectedEmployee.uid
    });

    setTitle("");
    setSelectedEmployee(null);
    setSearch("");
    loadData();
  };

  /* ===========================
     METRICS
  =========================== */
  const totalTasks = tasks.length;
  const pendingTasks = tasks.filter(t => t.status === "To Do").length;
  const completedTasks = tasks.filter(t => t.status === "Done").length;
  const delayedTasks = tasks.filter(t => t.delayed).length;

  const filteredEmployees = employees.filter(e =>
    (e.email || e.uid)
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  if (loading) {
    return <p>Loading admin dashboard...</p>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
      {/* HEADER */}
      <div>
        <h1 style={styles.pageTitle}>Admin Dashboard</h1>
        <p style={styles.pageSubtitle}>
          Monitor tasks across your organization
        </p>
      </div>

      {/* KPI CARDS */}
      <div style={styles.kpiGrid}>
        <KpiCard title="Total Tasks" value={totalTasks} variant="primary" />
        <KpiCard title="Pending Tasks" value={pendingTasks} variant="warning" />
        <KpiCard title="Completed Tasks" value={completedTasks} variant="success" />
        <KpiCard title="Delayed Tasks" value={delayedTasks} variant="danger" />
      </div>

      {/* CREATE TASK */}
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>Create Task</h3>
        <p style={styles.cardHint}>
          Assign a task to an employee in your organization
        </p>

        <div style={styles.createGrid}>
          <input
            placeholder="Task title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={styles.input}
          />

          {/* EMPLOYEE SELECTOR */}
          <div style={{ position: "relative" }}>
            <input
              placeholder="Search employee email"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setSelectedEmployee(null);
              }}
              style={styles.input}
            />

            {search && !selectedEmployee && (
              <div style={styles.dropdown}>
                {filteredEmployees.length === 0 && (
                  <div style={styles.dropdownItemMuted}>
                    No matching employees
                  </div>
                )}

                {filteredEmployees.map(emp => (
                  <div
                    key={emp.uid}
                    style={styles.dropdownItem}
                    onClick={() => {
                      setSelectedEmployee(emp);
                      setSearch(emp.email || emp.uid);
                    }}
                  >
                    {emp.email || emp.uid}
                  </div>
                ))}
              </div>
            )}
          </div>

          <button onClick={handleCreateTask} style={styles.primaryBtn}>
            Create
          </button>
        </div>
      </div>

      {/* ORGANIZATION TASKS */}
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>Organization Tasks</h3>

        {tasks.length === 0 && (
          <p style={styles.muted}>No tasks created yet.</p>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {tasks.map(task => (
            <div key={task.id} style={styles.taskRow}>
              <div>
                <p style={styles.taskTitle}>{task.title}</p>
                <p style={styles.taskMeta}>
                  Assigned to: {task.assignedTo}
                </p>
              </div>

              <div style={{ textAlign: "right" }}>
                <StatusPill status={task.status} />
                {task.delayed && (
                  <div style={styles.delayed}>Delayed</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ===========================
   UI COMPONENTS
=========================== */

function KpiCard({ title, value, variant }) {
  const variants = {
    primary: { bg: "rgba(22,166,176,0.05)", accent: "#16A6B0" },
    success: { bg: "rgba(34,197,94,0.05)", accent: "#22C55E" },
    warning: { bg: "rgba(234,179,8,0.05)", accent: "#EAB308" },
    danger: { bg: "rgba(239,68,68,0.05)", accent: "#EF4444" }
  };

  const v = variants[variant];

  return (
    <div style={{
      backgroundColor: v.bg,
      border: "1px solid #E2E8F0",
      borderRadius: "12px",
      padding: "24px"
    }}>
      <p style={styles.kpiTitle}>{title}</p>
      <h2 style={styles.kpiValue}>{value}</h2>
      <div style={{
        width: "40px",
        height: "4px",
        backgroundColor: v.accent,
        borderRadius: "999px",
        marginTop: "16px"
      }} />
    </div>
  );
}

function StatusPill({ status }) {
  const map = {
    "To Do": { bg: "#FEF3C7", color: "#92400E" },
    "In Progress": { bg: "#DBEAFE", color: "#1D4ED8" },
    "Done": { bg: "#DCFCE7", color: "#166534" }
  };

  const s = map[status] || map["To Do"];

  return (
    <span style={{
      padding: "6px 14px",
      borderRadius: "999px",
      fontSize: "12px",
      fontWeight: 600,
      backgroundColor: s.bg,
      color: s.color
    }}>
      {status}
    </span>
  );
}

/* ===========================
   STYLES
=========================== */

const styles = {
  pageTitle: { fontSize: "28px", fontWeight: 700, color: "#1E293B" },
  pageSubtitle: { fontSize: "15px", color: "#64748B" },
  kpiGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "24px"
  },
  kpiTitle: { fontSize: "14px", color: "#64748B" },
  kpiValue: { fontSize: "32px", fontWeight: 700 },
  card: {
    backgroundColor: "#FFFFFF",
    border: "1px solid #E2E8F0",
    borderRadius: "12px",
    padding: "24px"
  },
  cardTitle: { fontSize: "18px", fontWeight: 600 },
  cardHint: { fontSize: "14px", color: "#64748B", marginBottom: "20px" },
  createGrid: {
    display: "grid",
    gridTemplateColumns: "2fr 2fr 1fr",
    gap: "12px"
  },
  input: {
    padding: "12px 14px",
    borderRadius: "10px",
    border: "1px solid #E2E8F0",
    fontSize: "14px"
  },
  primaryBtn: {
    backgroundColor: "#16A6B0",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "10px",
    fontWeight: 600,
    cursor: "pointer"
  },
  dropdown: {
    position: "absolute",
    top: "48px",
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    border: "1px solid #E2E8F0",
    borderRadius: "10px",
    maxHeight: "180px",
    overflowY: "auto",
    zIndex: 10
  },
  dropdownItem: {
    padding: "10px 14px",
    cursor: "pointer",
    fontSize: "13px"
  },
  dropdownItemMuted: {
    padding: "10px 14px",
    fontSize: "13px",
    color: "#64748B"
  },
  taskRow: {
    border: "1px solid #E2E8F0",
    borderRadius: "12px",
    padding: "20px",
    display: "flex",
    justifyContent: "space-between"
  },
  taskTitle: { fontSize: "15px", fontWeight: 600 },
  taskMeta: { fontSize: "13px", color: "#64748B" },
  delayed: { fontSize: "12px", color: "#EF4444", fontWeight: 600 },
  muted: { fontSize: "14px", color: "#64748B" }
};

export default AdminDashboard;
