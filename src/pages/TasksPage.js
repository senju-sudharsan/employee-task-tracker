import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  getTasksByOrganization,
  createTask,
  getEmployeesByOrganization
} from "../services/taskService";
import { getAllOrganizations } from "../services/organizationService";
import { auth } from "../firebase";
import { getUserProfile } from "../services/authService";

/* ===========================
   OVERDUE CHECK
=========================== */
const isTaskOverdue = (task) => {
  if (!task.deadline || task.status === "Done") return false;

  const d =
    typeof task.deadline.toDate === "function"
      ? task.deadline.toDate()
      : new Date(task.deadline);

  return d < new Date();
};

function TasksPage() {
  const location = useLocation();
  const filter = new URLSearchParams(location.search).get("filter") || "all";

  const [profile, setProfile] = useState(null);

  const [organizations, setOrganizations] = useState([]);
  const [selectedOrgId, setSelectedOrgId] = useState(null);

  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [deadline, setDeadline] = useState("");

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  /* ===========================
     BOOTSTRAP USER
  =========================== */
  useEffect(() => {
    const init = async () => {
      const p = await getUserProfile(auth.currentUser.uid);
      setProfile(p);

      if (p.role === "super_admin") {
        const orgs = await getAllOrganizations();
        setOrganizations(orgs || []);
      } else {
        setSelectedOrgId(p.organizationId);
      }

      setLoading(false);
    };

    init();
  }, []);

  /* ===========================
     LOAD TASKS (ORG-BASED)
  =========================== */
  useEffect(() => {
    if (!selectedOrgId) return;

    const load = async () => {
      setLoading(true);

      const [taskData, employeeData] = await Promise.all([
        getTasksByOrganization(selectedOrgId),
        getEmployeesByOrganization(selectedOrgId)
      ]);

      setTasks(taskData || []);
      setEmployees(employeeData || []);
      setLoading(false);
    };

    load();
  }, [selectedOrgId]);

  /* ===========================
     CREATE TASK
  =========================== */
  const handleCreate = async () => {
    if (!title || !assignedTo || !selectedOrgId) {
      alert("All fields required");
      return;
    }

    setCreating(true);

    await createTask({
      title,
      description,
      assignedTo,
      organizationId: selectedOrgId,
      deadline: deadline ? new Date(deadline) : null
    });

    setTitle("");
    setDescription("");
    setAssignedTo("");
    setDeadline("");

    const refreshed = await getTasksByOrganization(selectedOrgId);
    setTasks(refreshed || []);
    setCreating(false);
  };

  /* ===========================
     FILTER TASKS
  =========================== */
  const visibleTasks = tasks.filter((t) => {
    if (filter === "completed") return t.status === "Done";
    if (filter === "pending") return t.status !== "Done";
    if (filter === "overdue") return isTaskOverdue(t);
    return true;
  });

  if (!profile) return <p>Loading…</p>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      <h1>Tasks</h1>

      {/* SUPER ADMIN ORG SELECT */}
      {profile.role === "super_admin" && (
        <select
          value={selectedOrgId || ""}
          onChange={(e) => setSelectedOrgId(e.target.value)}
        >
          <option value="">Select organization</option>
          {organizations.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
      )}

      {!selectedOrgId && profile.role === "super_admin" && (
        <p style={{ color: "#64748B" }}>
          Select an organization to view tasks
        </p>
      )}

      {/* CREATE TASK */}
      {selectedOrgId && (
        <div>
          <h3>Create Task</h3>

          <input
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <select
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
          >
            <option value="">Assign to employee</option>
            {employees.map((e) => (
              <option key={e.uid} value={e.uid}>
                {e.name || e.email}
              </option>
            ))}
          </select>

          <input
            type="datetime-local"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />

          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <button onClick={handleCreate} disabled={creating}>
            {creating ? "Creating…" : "Create Task"}
          </button>
        </div>
      )}

      {/* TASK LIST */}
      {loading ? (
        <p>Loading tasks…</p>
      ) : visibleTasks.length === 0 ? (
        <p>No tasks found.</p>
      ) : (
        visibleTasks.map((t) => (
          <div key={t.id}>
            <strong>{t.title}</strong> — {t.status}
          </div>
        ))
      )}
    </div>
  );
}

export default TasksPage;
