import { useEffect, useState } from "react";
import { auth } from "../firebase";
import {
  getTasksByEmployee,
  updateTaskStatus,
  acknowledgeTask,
  markTaskDelayed
} from "../services/taskService";

/**
 * EMPLOYEE DASHBOARD
 * Tasks = dashboard
 * Claude-style, lifecycle-colored cards
 * UI LOCKED
 */

function EmployeeDashboard() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("active");
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    const data = await getTasksByEmployee(auth.currentUser.uid);
    setTasks(data || []);
    setLoading(false);
  };

  /* ===========================
     METRICS
  =========================== */
  const total = tasks.length;
  const active = tasks.filter(t => t.status !== "Done").length;
  const overdue = tasks.filter(t => t.delayed).length;

  /* ===========================
     SORTING
  =========================== */
  const priorityRank = { high: 1, medium: 2, low: 3 };

  const sortedTasks = [...tasks].sort((a, b) => {
    if (sortBy === "priority") {
      return (
        (priorityRank[a.priority || "medium"] || 2) -
        (priorityRank[b.priority || "medium"] || 2)
      );
    }
    if (sortBy === "status") {
      return a.status.localeCompare(b.status);
    }
    return a.status === "Done" ? 1 : -1;
  });

  /* ===========================
     ACTION HANDLER
  =========================== */
  const act = async (fn, id) => {
    setSavingId(id);
    await fn(id);
    await loadTasks();
    setSavingId(null);
  };

  if (loading) {
    return <p style={{ color: "#64748B" }}>Loading your tasks…</p>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
      {/* HEADER */}
      <div>
        <h1 style={styles.title}>My Work</h1>
        <p style={styles.subtitle}>
          An overview of your assigned tasks
        </p>
      </div>

      {/* STATS */}
      <div style={styles.statsGrid}>
        <StatCard label="Total" value={total} />
        <StatCard label="Active" value={active} variant="active" />
        <StatCard label="Overdue" value={overdue} variant="overdue" />
      </div>

      {/* SORT */}
      <div style={styles.controls}>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          style={styles.select}
        >
          <option value="active">Active first</option>
          <option value="priority">Priority</option>
          <option value="status">Status</option>
        </select>
      </div>

      {/* TASK SECTION (FIXED WHITE BOX ISSUE) */}
      <div
        style={{
          padding: "28px",
          borderRadius: "20px",
          background: "#FEFCF8",
          border: "1px solid #EAE7E2",
          display: "flex",
          flexDirection: "column",
          gap: "16px"
        }}
      >
        {sortedTasks.length === 0 && (
          <p style={styles.muted}>No tasks assigned.</p>
        )}

        {sortedTasks.map(task => {
          const bg =
            task.status === "Done"
              ? "#ECFDF5"
              : task.delayed
              ? "#FEF2F2"
              : "#FFFBEB";

          return (
            <div
              key={task.id}
              style={{
                ...styles.taskCard,
                backgroundColor: bg
              }}
            >
              <div style={styles.taskHeader}>
                <h3 style={styles.taskTitle}>{task.title}</h3>
                <PriorityPill level={task.priority || "medium"} />
              </div>

              <p style={styles.assigned}>
                Assigned by admin
              </p>

              <div style={styles.meta}>
                <StatusPill status={task.status} />
                {task.delayed && (
                  <span style={styles.overdue}>Overdue</span>
                )}
              </div>

              <div style={styles.actions}>
                {!task.acknowledged && (
                  <button
                    disabled={savingId === task.id}
                    onClick={() => act(acknowledgeTask, task.id)}
                    style={styles.secondaryBtn}
                  >
                    Acknowledge
                  </button>
                )}

                {task.status !== "Done" && (
                  <button
                    disabled={savingId === task.id}
                    onClick={() =>
                      act(id => updateTaskStatus(id, "Done"), task.id)
                    }
                    style={styles.primaryBtn}
                  >
                    Complete
                  </button>
                )}

                {!task.delayed && task.status !== "Done" && (
                  <button
                    disabled={savingId === task.id}
                    onClick={() => act(markTaskDelayed, task.id)}
                    style={styles.warningBtn}
                  >
                    Mark Delayed
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ===========================
   SMALL UI PARTS
=========================== */

function StatCard({ label, value, variant = "default" }) {
  const variants = {
    default: { bg: "#FFFFFF", color: "#0F172A" },
    active: { bg: "#E0F2FE", color: "#0369A1" },
    overdue: { bg: "#FEE2E2", color: "#991B1B" }
  };

  const v = variants[variant];

  return (
    <div style={{
      background: v.bg,
      borderRadius: "16px",
      padding: "20px",
      minHeight: "110px"
    }}>
      <p style={{ fontSize: "14px", color: "#64748B" }}>{label}</p>
      <h2 style={{ fontSize: "28px", fontWeight: 700, color: v.color }}>
        {value}
      </h2>
    </div>
  );
}

function PriorityPill({ level }) {
  const map = {
    high: { bg: "#FEE2E2", color: "#991B1B" },
    medium: { bg: "#FEF3C7", color: "#92400E" },
    low: { bg: "#DCFCE7", color: "#166534" }
  };

  const s = map[level];

  return (
    <span style={{
      padding: "4px 10px",
      borderRadius: "999px",
      fontSize: "12px",
      fontWeight: 600,
      backgroundColor: s.bg,
      color: s.color
    }}>
      {level}
    </span>
  );
}

function StatusPill({ status }) {
  return (
    <span style={{ fontSize: "12px", fontWeight: 600, color: "#475569" }}>
      {status}
    </span>
  );
}

/* ===========================
   STYLES
=========================== */

const styles = {
  title: { fontSize: "28px", fontWeight: 700 },
  subtitle: { fontSize: "15px", color: "#64748B" },
  muted: { color: "#64748B" },

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "16px"
  },

  controls: {
    display: "flex",
    justifyContent: "flex-end"
  },
  select: {
    padding: "10px 12px",
    borderRadius: "10px",
    border: "1px solid #E2E8F0"
  },

  taskCard: {
    borderRadius: "16px",
    padding: "20px",
    border: "1px solid #E2E8F0"
  },
  taskHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  taskTitle: { fontSize: "16px", fontWeight: 600 },
  assigned: { fontSize: "14px", color: "#64748B" },
  meta: {
    display: "flex",
    gap: "12px",
    marginTop: "6px"
  },
  overdue: { color: "#DC2626", fontWeight: 600 },

  actions: {
    display: "flex",
    gap: "10px",
    marginTop: "14px"
  },
  primaryBtn: {
    background: "#16A6B0",
    color: "#FFF",
    border: "none",
    borderRadius: "10px",
    padding: "10px 14px",
    fontWeight: 600
  },
  secondaryBtn: {
    background: "#E0F2FE",
    color: "#0369A1",
    border: "none",
    borderRadius: "10px",
    padding: "10px 14px",
    fontWeight: 600
  },
  warningBtn: {
    background: "#FEF3C7",
    color: "#92400E",
    border: "none",
    borderRadius: "10px",
    padding: "10px 14px",
    fontWeight: 600
  }
};

export default EmployeeDashboard;
