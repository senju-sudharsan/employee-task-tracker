import { useEffect, useState } from "react";
import { auth } from "../firebase";
import {
  getTasksByEmployee,
  updateTaskStatus,
  acknowledgeTask,
  markTaskDelayed
} from "../services/taskService";

/**
 * Employee Dashboard
 * - Shows employee-assigned tasks only
 * - Employee lifecycle actions:
 *   - Acknowledge
 *   - Mark Complete
 *   - Mark Delayed
 * - Claude-style UI
 */
function EmployeeDashboard() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingTaskId, setSavingTaskId] = useState(null);

  /* ===========================
     LOAD TASKS
  =========================== */
  const loadTasks = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    const data = await getTasksByEmployee(auth.currentUser.uid);
    setTasks(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadTasks();
  }, []);

  /* ===========================
     ACTIONS
  =========================== */
  const handleAcknowledge = async (taskId) => {
    setSavingTaskId(taskId);
    await acknowledgeTask(taskId);
    await loadTasks();
    setSavingTaskId(null);
  };

  const handleComplete = async (taskId) => {
    setSavingTaskId(taskId);
    await updateTaskStatus(taskId, "Done");
    await loadTasks();
    setSavingTaskId(null);
  };

  const handleDelayed = async (taskId) => {
    setSavingTaskId(taskId);
    await markTaskDelayed(taskId);
    await loadTasks();
    setSavingTaskId(null);
  };

  /* ===========================
     RENDER
  =========================== */
  if (loading) {
    return <p style={{ color: "#64748B" }}>Loading your tasks…</p>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
      {/* HEADER */}
      <div>
        <h1 style={styles.pageTitle}>My Tasks</h1>
        <p style={styles.pageSubtitle}>
          Tasks assigned to you and their current status
        </p>
      </div>

      {tasks.length === 0 && (
        <p style={styles.muted}>No tasks assigned to you.</p>
      )}

      {/* TASK LIST */}
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {tasks.map((task) => {
          const completedLate =
            task.status === "Done" && task.delayed === true;

          return (
            <div key={task.id} style={styles.taskCard}>
              {/* TITLE + STATUS */}
              <div style={styles.taskHeader}>
                <h3 style={styles.taskTitle}>{task.title}</h3>
                <StatusPill
                  status={
                    completedLate ? "Completed Late" : task.status
                  }
                />
              </div>

              {/* FLAGS */}
              <div style={styles.flags}>
                {task.acknowledged && (
                  <span style={styles.acknowledged}>Acknowledged</span>
                )}
                {task.delayed && (
                  <span style={styles.delayed}>Delayed</span>
                )}
              </div>

              {/* ACTIONS */}
              <div style={styles.actions}>
                {!task.acknowledged && (
                  <button
                    disabled={savingTaskId === task.id}
                    onClick={() => handleAcknowledge(task.id)}
                    style={styles.secondaryBtn}
                  >
                    Acknowledge
                  </button>
                )}

                {task.status !== "Done" && (
                  <button
                    disabled={savingTaskId === task.id}
                    onClick={() => handleComplete(task.id)}
                    style={styles.primaryBtn}
                  >
                    Mark Complete
                  </button>
                )}

                {!task.delayed && task.status !== "Done" && (
                  <button
                    disabled={savingTaskId === task.id}
                    onClick={() => handleDelayed(task.id)}
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
   UI COMPONENTS
=========================== */

function StatusPill({ status }) {
  const map = {
    "To Do": { bg: "#FEF3C7", color: "#92400E" },
    "In Progress": { bg: "#DBEAFE", color: "#1D4ED8" },
    "Done": { bg: "#DCFCE7", color: "#166534" },
    "Completed Late": { bg: "#FEE2E2", color: "#991B1B" }
  };

  const s = map[status] || map["To Do"];

  return (
    <span
      style={{
        padding: "6px 12px",
        borderRadius: "999px",
        fontSize: "12px",
        fontWeight: 600,
        backgroundColor: s.bg,
        color: s.color
      }}
    >
      {status}
    </span>
  );
}

/* ===========================
   STYLES
=========================== */

const styles = {
  pageTitle: {
    fontSize: "28px",
    fontWeight: 700,
    color: "#1E293B"
  },
  pageSubtitle: {
    fontSize: "15px",
    color: "#64748B"
  },
  muted: {
    fontSize: "14px",
    color: "#64748B"
  },
  taskCard: {
    background: "#FFFFFF",
    border: "1px solid #E2E8F0",
    borderRadius: "16px",
    padding: "22px",
    display: "flex",
    flexDirection: "column",
    gap: "14px"
  },
  taskHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  taskTitle: {
    fontSize: "16px",
    fontWeight: 600,
    color: "#1E293B"
  },
  flags: {
    display: "flex",
    gap: "12px",
    fontSize: "13px"
  },
  acknowledged: {
    color: "#16A34A",
    fontWeight: 600
  },
  delayed: {
    color: "#DC2626",
    fontWeight: 600
  },
  actions: {
    display: "flex",
    gap: "10px",
    marginTop: "8px"
  },
  primaryBtn: {
    backgroundColor: "#16A6B0",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "10px",
    padding: "10px 14px",
    fontWeight: 600,
    cursor: "pointer"
  },
  secondaryBtn: {
    backgroundColor: "#E0F2FE",
    color: "#0369A1",
    border: "none",
    borderRadius: "10px",
    padding: "10px 14px",
    fontWeight: 600,
    cursor: "pointer"
  },
  warningBtn: {
    backgroundColor: "#FEF3C7",
    color: "#92400E",
    border: "none",
    borderRadius: "10px",
    padding: "10px 14px",
    fontWeight: 600,
    cursor: "pointer"
  }
};

export default EmployeeDashboard;
