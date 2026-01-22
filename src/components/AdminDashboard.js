import { useEffect, useState, useCallback } from "react";
import {
  getTasksByOrganization,
  createTask
} from "../services/taskService";

/**
 * Admin Dashboard
 * - Shows summary cards
 * - Allows task creation
 * - Lists organization tasks
 */
function AdminDashboard({ user }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [assignedTo, setAssignedTo] = useState("");

  /* ===========================
     LOAD TASKS (ORG-SCOPED)
  =========================== */
  const loadTasks = useCallback(async () => {
    if (!user?.organizationId) return;

    setLoading(true);
    const data = await getTasksByOrganization(user.organizationId);
    setTasks(data || []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  /* ===========================
     CREATE TASK
  =========================== */
  const handleCreateTask = async () => {
    if (!title.trim() || !assignedTo.trim()) return;

    await createTask({
      title,
      organizationId: user.organizationId,
      assignedTo
    });

    setTitle("");
    setAssignedTo("");
    await loadTasks();
  };

  /* ===========================
     DERIVED STATS
  =========================== */
  const totalTasks = tasks.length;
  const pendingTasks = tasks.filter((t) => t.status === "To Do").length;
  const completedTasks = tasks.filter((t) => t.status === "Done").length;
  const delayedTasks = tasks.filter((t) => t.delayed).length;

  /* ===========================
     RENDER
  =========================== */
  if (loading) {
    return <p>Loading admin dashboard...</p>;
  }

  return (
    <>
      <h2 style={{ marginBottom: "20px" }}>Admin Dashboard</h2>

      {/* SUMMARY CARDS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "18px",
          marginBottom: "32px"
        }}
      >
        <StatCard title="Total Tasks" value={totalTasks} color="#0284c7" />
        <StatCard title="Pending Tasks" value={pendingTasks} color="#f59e0b" />
        <StatCard title="Delayed Tasks" value={delayedTasks} color="#dc2626" />
        <StatCard title="Completed Tasks" value={completedTasks} color="#16a34a" />
      </div>

      {/* CREATE TASK */}
      <div
        style={{
          backgroundColor: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: "12px",
          padding: "20px",
          marginBottom: "32px"
        }}
      >
        <h3 style={{ marginBottom: "12px" }}>Create Task</h3>

        <div style={{ display: "flex", gap: "10px" }}>
          <input
            placeholder="Task title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <input
            placeholder="Assign to Employee UID"
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
          />
          <button onClick={handleCreateTask}>Create</button>
        </div>
      </div>

      {/* TASK LIST */}
      <div
        style={{
          backgroundColor: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: "12px",
          padding: "20px"
        }}
      >
        <h3 style={{ marginBottom: "12px" }}>Organization Tasks</h3>

        {tasks.length === 0 && <p>No tasks available.</p>}

        {tasks.map((task) => (
          <div
            key={task.id}
            style={{
              borderBottom: "1px solid #e5e7eb",
              padding: "10px 0"
            }}
          >
            <strong>{task.title}</strong>
            <p>Status: {task.status}</p>
            <p>Assigned To: {task.assignedTo}</p>
            {task.delayed && <span style={{ color: "red" }}>Delayed</span>}
          </div>
        ))}
      </div>
    </>
  );
}

/* ===========================
   STAT CARD
=========================== */
function StatCard({ title, value, color }) {
  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: "12px",
        padding: "18px",
        borderLeft: `4px solid ${color}`
      }}
    >
      <p style={{ fontSize: "14px", color: "#64748b" }}>{title}</p>
      <h3 style={{ fontSize: "26px", fontWeight: "600", color }}>{value}</h3>
    </div>
  );
}

export default AdminDashboard;
