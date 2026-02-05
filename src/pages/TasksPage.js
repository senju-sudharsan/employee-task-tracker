import { useEffect, useState } from "react";
import {
  getTasksByOrganization,
  createTask,
  getEmployeesByOrganization
} from "../services/taskService";
import { auth } from "../firebase";
import { getUserProfile } from "../services/authService";

function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState("");

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setLoading(true);

    const profile = await getUserProfile(auth.currentUser.uid);
    const orgId = profile.organizationId;

    const [taskData, employeeData] = await Promise.all([
      getTasksByOrganization(orgId),
      getEmployeesByOrganization(orgId)
    ]);

    setTasks(taskData || []);
    setEmployees(employeeData || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async () => {
    if (!title || !assignedTo) return;

    setCreating(true);

    const profile = await getUserProfile(auth.currentUser.uid);

    await createTask({
      title,
      organizationId: profile.organizationId,
      assignedTo,
      description
    });

    setTitle("");
    setDescription("");
    setAssignedTo("");

    await load();
    setCreating(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
      {/* HEADER */}
      <div>
        <h1 style={styles.pageTitle}>Tasks</h1>
        <p style={styles.pageSubtitle}>
          Track and manage tasks across your organization
        </p>
      </div>

      {/* CREATE TASK */}
      <div style={styles.createCard}>
        <h3 style={styles.cardTitle}>Create Task</h3>

        <div style={styles.createGrid}>
          <input
            placeholder="Task title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={styles.input}
          />

          <select
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            style={styles.input}
          >
            <option value="">Assign to employee</option>
            {employees.map((e) => (
              <option key={e.uid} value={e.uid}>
                {e.name || e.email}
              </option>
            ))}
          </select>

          <textarea
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{ ...styles.input, gridColumn: "1 / -1", height: 80 }}
          />

          <button
            onClick={handleCreate}
            disabled={creating}
            style={styles.primaryBtn}
          >
            {creating ? "Creating..." : "Create Task"}
          </button>
        </div>
      </div>

      {/* TASK LIST */}
      {loading ? (
        <p style={styles.muted}>Loading tasks…</p>
      ) : tasks.length === 0 ? (
        <p style={styles.muted}>No tasks found.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {tasks.map((task) => {
            const s = getStatusStyle(task.status, task.delayed);

            return (
              <div
                key={task.id}
                style={{
                  ...styles.taskCard,
                  backgroundColor: s.bg,
                  borderLeft: `4px solid ${s.border}`
                }}
              >
                <div style={styles.taskTop}>
                  <h3 style={styles.taskTitle}>{task.title}</h3>

                  <span
                    style={{
                      ...styles.statusPill,
                      backgroundColor: s.pillBg,
                      color: s.pillColor
                    }}
                  >
                    {s.label}
                  </span>
                </div>

                <p style={styles.assigned}>
                  Assigned to <strong>{task.assignedTo}</strong>
                </p>

                {task.description && (
                  <p style={styles.description}>{task.description}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ===========================
   STATUS MAP
=========================== */

function getStatusStyle(status, delayed) {
  if (delayed) {
    return {
      label: "Delayed",
      bg: "#FEF2F2",
      border: "#DC2626",
      pillBg: "#FEE2E2",
      pillColor: "#991B1B"
    };
  }

  if (status === "Done") {
    return {
      label: "Done",
      bg: "#ECFDF5",
      border: "#22C55E",
      pillBg: "#DCFCE7",
      pillColor: "#166534"
    };
  }

  if (status === "In Progress") {
    return {
      label: "In Progress",
      bg: "#EFF6FF",
      border: "#3B82F6",
      pillBg: "#DBEAFE",
      pillColor: "#1E40AF"
    };
  }

  return {
    label: "To Do",
    bg: "#FFFBEB",
    border: "#F59E0B",
    pillBg: "#FEF3C7",
    pillColor: "#92400E"
  };
}

/* ===========================
   STYLES (Claude-aligned)
=========================== */

const styles = {
  pageTitle: { fontSize: "28px", fontWeight: 700, color: "#1E293B" },
  pageSubtitle: { fontSize: "15px", color: "#64748B" },
  muted: { fontSize: "14px", color: "#64748B" },

  createCard: {
    background: "#FFFFFF",
    border: "1px dashed #CBD5E1",
    borderRadius: "16px",
    padding: "24px"
  },
  cardTitle: { fontSize: "18px", fontWeight: 600, marginBottom: "12px" },
  createGrid: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr",
    gap: "12px"
  },
  input: {
    padding: "12px 14px",
    borderRadius: "10px",
    border: "1px solid #E2E8F0",
    backgroundColor: "#F8FAFC",
    fontSize: "14px"
  },
  primaryBtn: {
    gridColumn: "1 / -1",
    background: "#16A6B0",
    color: "#FFF",
    border: "none",
    borderRadius: "10px",
    fontWeight: 600,
    padding: "12px",
    cursor: "pointer"
  },

  taskCard: {
    borderRadius: "16px",
    padding: "18px",
    border: "1px solid #E2E8F0"
  },
  taskTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px"
  },
  taskTitle: { fontSize: "16px", fontWeight: 600 },
  assigned: {
    fontSize: "14px",
    color: "#475569",
    marginTop: "4px"
  },
  description: {
    fontSize: "14px",
    color: "#475569",
    marginTop: "6px",
    lineHeight: 1.5
  },
  statusPill: {
    padding: "6px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: 600,
    whiteSpace: "nowrap"
  }
};

export default TasksPage;
