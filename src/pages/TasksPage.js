import { useEffect, useState } from "react";
import { auth } from "../firebase";
import { getAllTasks, getTasksByOrganization } from "../services/taskService";
import { getUserProfile } from "../services/authService";

/**
 * Tasks Page
 * - Admin: organization tasks (read-only)
 * - Super Admin: all tasks (read-only)
 * - Employee: no access (dashboard only)
 */
function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!auth.currentUser) return;

      const profile = await getUserProfile(auth.currentUser.uid);
      const normalizedRole = profile.role?.toLowerCase().trim();
      setRole(normalizedRole);

      if (normalizedRole === "employee") {
        setTasks([]);
        setLoading(false);
        return;
      }

      if (normalizedRole === "admin") {
        const data = await getTasksByOrganization(profile.organizationId);
        setTasks(data || []);
      }

      if (
        normalizedRole === "super_admin" ||
        normalizedRole === "superadmin"
      ) {
        const data = await getAllTasks();
        setTasks(data || []);
      }

      setLoading(false);
    };

    load();
  }, []);

  if (loading) return <p>Loading tasks...</p>;

  if (role === "employee") {
    return (
      <div>
        <h2>Tasks</h2>
        <p style={{ color: "#64748b" }}>
          Task actions are available only in your dashboard.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <h2 style={{ fontSize: "24px", fontWeight: 600 }}>Tasks</h2>

      {tasks.length === 0 && (
        <p style={{ color: "#64748b" }}>No tasks available.</p>
      )}

      {tasks.map((task) => (
        <div
          key={task.id}
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "14px",
            padding: "18px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          <div>
            <p style={{ fontWeight: 600 }}>{task.title}</p>
            <p style={{ fontSize: "13px", color: "#64748b" }}>
              Assigned to: {task.assignedTo}
            </p>
          </div>

          <div style={{ textAlign: "right" }}>
            <StatusPill status={task.status} />
            {task.delayed && (
              <div style={{ fontSize: "12px", color: "#ef4444", marginTop: "6px" }}>
                Delayed
              </div>
            )}
          </div>
        </div>
      ))}
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

export default TasksPage;
