import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  getTasksByOrganization,
  createTask,
  getEmployeesByOrganization,
  createTaskForAllEmployees
} from "../services/taskService";
import { getAllOrganizations } from "../services/organizationService";
import { auth } from "../firebase";
import { getUserProfile } from "../services/authService";
import {
  Plus,
  Filter,
  Clock,
  AlertCircle,
  CheckCircle2,
  Circle,
  ChevronDown,
  Calendar,
  User,
  Loader2
} from "lucide-react";

/* ===========================
   HELPERS
=========================== */
const isTaskOverdue = (task) => {
  if (!task.deadline || task.status === "Done") return false;
  const d =
    typeof task.deadline.toDate === "function"
      ? task.deadline.toDate()
      : new Date(task.deadline);
  return d < new Date();
};

const priorityRank = { high: 1, medium: 2, low: 3 };

function TasksPage() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const searchParams = new URLSearchParams(location.search);
  const filter = searchParams.get("filter") || "all";
  const orgFromUrl = searchParams.get("org") || "";
  const sortFromUrl = searchParams.get("sort") || "priority";

  const [profile, setProfile] = useState(null);

  const [organizations, setOrganizations] = useState([]);
  const [selectedOrgId, setSelectedOrgId] = useState("");

  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [assignedTo, setAssignedTo] = useState("");
  const [assignAll, setAssignAll] = useState(false);
  const [deadline, setDeadline] = useState("");

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [sortBy, setSortBy] = useState(sortFromUrl);

  const [showCreatePanel, setShowCreatePanel] = useState(false);


  /* ===========================
     INIT
  =========================== */
  useEffect(() => {
    const init = async () => {
      const p = await getUserProfile(auth.currentUser.uid);
      setProfile(p);

      if (p.role === "super_admin") {
        const orgs = await getAllOrganizations();
        setOrganizations(orgs || []);
        
        // Set selectedOrgId from URL if present, otherwise leave empty
        if (orgFromUrl) {
          setSelectedOrgId(orgFromUrl);
        }
      } else {
        // For non-super admins, use their organization
        setSelectedOrgId(p.organizationId);
        
        // Update URL to include their org if not already there
        if (!orgFromUrl) {
          const newParams = new URLSearchParams(location.search);
          newParams.set("org", p.organizationId);
          navigate(`?${newParams.toString()}`, { replace: true });
        }
      }

      setLoading(false);
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  /* ===========================
     SYNC selectedOrgId FROM URL
  =========================== */
  useEffect(() => { 
    // Update local state when URL changes (e.g., browser back/forward)
    if (orgFromUrl && orgFromUrl !== selectedOrgId) {
      setSelectedOrgId(orgFromUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgFromUrl]);

  /* ===========================
     SYNC sortBy FROM URL
  =========================== */
  useEffect(() => {
    if (sortFromUrl !== sortBy) {
      setSortBy(sortFromUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortFromUrl]);

  /* ===========================
     LOAD TASKS + EMPLOYEES
  =========================== */
  useEffect(() => {
    if (!selectedOrgId) {
      setTasks([]);
      setEmployees([]);
      return;
    }

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
     HANDLE ORG CHANGE
  =========================== */
  const handleOrgChange = (newOrgId) => {
    setSelectedOrgId(newOrgId);
    
    // Update URL with new org
    const newParams = new URLSearchParams(location.search);
    if (newOrgId) {
      newParams.set("org", newOrgId);
    } else {
      newParams.delete("org");
    }
    navigate(`?${newParams.toString()}`, { replace: true });
  };

  /* ===========================
     CREATE TASK
  =========================== */
  const handleCreate = async () => {
    if (!title || !selectedOrgId) {
      alert("Title and organization required");
      return;
    }

    if (!assignAll && !assignedTo) {
      alert("Please select an employee or assign to all");
      return;
    }

    if (assignAll && employees.length === 0) {
      alert("This organization has no employees");
      return;
    }

    setCreating(true);

    if (assignAll) {
      await createTaskForAllEmployees({
        title,
        description,
        priority,
        organizationId: selectedOrgId,
        deadline: deadline ? new Date(deadline) : null
      });
    } else {
      await createTask({
        title,
        description,
        priority,
        assignedTo,
        organizationId: selectedOrgId,
        deadline: deadline ? new Date(deadline) : null
      });
    }

    setTitle("");
    setDescription("");
    setAssignedTo("");
    setAssignAll(false);
    setPriority("medium");
    setDeadline("");
    setShowCreatePanel(false);

    const refreshed = await getTasksByOrganization(selectedOrgId);
    setTasks(refreshed || []);
    setCreating(false);
  };

  /* ===========================
     BUILD FILTER LINK
  =========================== */
  const buildFilterLink = (filterKey) => {
    const params = new URLSearchParams();
    params.set("filter", filterKey);

    if (selectedOrgId) params.set("org", selectedOrgId);
    if (sortBy) params.set("sort", sortBy);

    return `?${params.toString()}`;
  };

  /* ===========================
     FILTER + SORT
  =========================== */
  const visibleTasks = tasks
    .filter((t) => {
      if (filter === "completed") return t.status === "Done" && !t.completedLate;
      if (filter === "pending") return t.status !== "Done";
      if (filter === "overdue") return isTaskOverdue(t);
      if (filter === "completed-late") return t.status === "Done" && t.completedLate === true;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "priority") {
        return priorityRank[a.priority] - priorityRank[b.priority];
      }
      if (sortBy === "createdAt") {
        return b.createdAt?.seconds - a.createdAt?.seconds;
      }
      return 0;
    });

  /* ===========================
     HELPER FUNCTIONS
  =========================== */
  const getStatusConfig = (task) => {
    // Check completed late FIRST before other statuses
    if (task.status === "Done" && task.completedLate === true) {
      return {
        label: "Completed Late",
        color: "#F59E0B",
        bg: "#FEF3C7",
        icon: Clock
      };
    }
    
    if (isTaskOverdue(task)) {
      return {
        label: "Overdue",
        color: "#EF4444",
        bg: "#FEE2E2",
        icon: AlertCircle
      };
    }
    
    if (task.status === "Done") {
      return {
        label: "Completed",
        color: "#22C55E",
        bg: "#DCFCE7",
        icon: CheckCircle2
      };
    }
    
    return {
      label: "In Progress",
      color: "#FACC15",
      bg: "#FEF9C3",
      icon: Circle
    };
  };

  const getPriorityConfig = (priority) => {
    const configs = {
      high: { label: "High", color: "#EF4444", bg: "#FEE2E2" },
      medium: { label: "Medium", color: "#F59E0B", bg: "#FEF3C7" },
      low: { label: "Low", color: "#38BDF8", bg: "#E0F2FE" }
    };
    return configs[priority] || configs.medium;
  };

  const formatDeadline = (deadline) => {
    if (!deadline) return null;
    const d =
      typeof deadline.toDate === "function"
        ? deadline.toDate()
        : new Date(deadline);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getEmployeeName = (uid) => {
    const emp = employees.find((e) => e.uid === uid);
    return emp ? emp.name || emp.email : "Unassigned";
  };

  const filterCounts = {
    all: tasks.length,
    pending: tasks.filter((t) => t.status !== "Done").length,
    completed: tasks.filter((t) => t.status === "Done" && !t.completedLate).length,
    overdue: tasks.filter((t) => isTaskOverdue(t)).length,
    "completed-late": tasks.filter((t) => t.status === "Done" && t.completedLate === true).length
  };

  if (!profile)
    return (
      <div style={styles.loadingContainer}>
        <Loader2 size={32} style={{ animation: "spin 1s linear infinite" }} />
      </div>
    );

  return (
    <div style={styles.container}>
      {/* HEADER */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Task Management</h1>
          <p style={styles.subtitle}>
            Create, assign, and track tasks across your organization
          </p>
        </div>

        {selectedOrgId && (
          <button
            onClick={() => setShowCreatePanel(!showCreatePanel)}
            style={{
              ...styles.primaryButton,
              opacity: showCreatePanel ? 0.8 : 1
            }}
          >
            <Plus size={18} />
            {showCreatePanel ? "Cancel" : "Create Task"}
          </button>
        )}
      </div>

      {/* SUPER ADMIN ORG SELECT */}
      {profile.role === "super_admin" && (
        <div style={styles.orgSelectContainer}>
          <div style={styles.selectWrapper}>
            <Building2Icon size={18} style={{ color: "#64748B" }} />
            <select
              value={selectedOrgId}
              onChange={(e) => handleOrgChange(e.target.value)}
              style={styles.orgSelect}
              disabled={loading}
            >
              <option value="">Select an organization</option>
              {organizations.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
            <ChevronDown size={18} style={{ color: "#64748B" }} />
          </div>
        </div>
      )}

      {/* CREATE TASK PANEL */}
      {showCreatePanel && selectedOrgId && (
        <div style={styles.createPanel}>
          <div style={styles.createPanelHeader}>
            <h3 style={styles.createPanelTitle}>Create New Task</h3>
            <p style={styles.createPanelSubtitle}>
              Fill in the details to assign a task
            </p>
          </div>

          <div style={styles.formGrid}>
            {/* Title */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Task Title *</label>
              <input
                placeholder="Enter task title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={styles.input}
              />
            </div>

            {/* Priority */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Priority</label>
              <div style={styles.selectWrapper}>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  style={styles.select}
                >
                  <option value="high">High Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="low">Low Priority</option>
                </select>
                <ChevronDown
                  size={16}
                  style={{ color: "#64748B", pointerEvents: "none" }}
                />
              </div>
            </div>

            {/* Deadline */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Deadline</label>
              <div style={{ position: "relative" }}>
                <Calendar
                  size={18}
                  style={{
                    position: "absolute",
                    left: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#64748B",
                    pointerEvents: "none"
                  }}
                />
                <input
                  type="datetime-local"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  style={{ ...styles.input, paddingLeft: 40 }}
                />
              </div>
            </div>

            {/* Assignment */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Assign To</label>

              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={assignAll}
                  onChange={(e) => setAssignAll(e.target.checked)}
                  style={styles.checkbox}
                />
                <span>Assign to all employees</span>
              </label>

              {!assignAll && (
                <div style={styles.selectWrapper}>
                  <User size={18} style={{ color: "#64748B" }} />
                  <select
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    style={styles.select}
                  >
                    <option value="">Select an employee</option>
                    {employees.map((e) => (
                      <option key={e.uid} value={e.uid}>
                        {e.name || e.email}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={16}
                    style={{ color: "#64748B", pointerEvents: "none" }}
                  />
                </div>
              )}
            </div>

            {/* Description */}
            <div style={{ ...styles.formGroup, gridColumn: "1 / -1" }}>
              <label style={styles.label}>Description</label>
              <textarea
                placeholder="Add task details and instructions..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={styles.textarea}
                rows={4}
              />
            </div>
          </div>

          <div style={styles.formActions}>
            <button
              onClick={() => setShowCreatePanel(false)}
              style={styles.secondaryButton}
              disabled={creating}
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={creating}
              style={{
                ...styles.primaryButton,
                opacity: creating ? 0.6 : 1,
                cursor: creating ? "not-allowed" : "pointer"
              }}
            >
              {creating ? (
                <>
                  <Loader2
                    size={18}
                    style={{ animation: "spin 1s linear infinite" }}
                  />
                  Creating...
                </>
              ) : (
                <>
                  <Plus size={18} />
                  Create Task
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* FILTERS & CONTROLS */}
      {selectedOrgId && (
        <div style={styles.controlsBar}>
          {/* Filter Tabs */}
          {[
  { key: "all", label: "All Tasks" },
  { key: "pending", label: "Pending" },
  { key: "completed", label: "Completed" },
  { key: "overdue", label: "Overdue" },
  { key: "completed-late", label: "Completed Late" }
].map((f) => (
  <a
    key={f.key}
    href={buildFilterLink(f.key)}
    style={{
      ...styles.filterTab,
      ...(filter === f.key ? styles.filterTabActive : {})
    }}
  >
    {f.label}
    <span
      style={{
        ...styles.filterBadge,
        ...(filter === f.key ? styles.filterBadgeActive : {})
      }}
    >
      {filterCounts[f.key]}
    </span>
  </a>
))}


          {/* Sort */}
          <div style={styles.selectWrapper}>
            <Filter size={16} style={{ color: "#64748B" }} />
            <select
              value={sortBy}
              onChange={(e) => {
                const value = e.target.value;
                setSortBy(value);

                const params = new URLSearchParams(location.search);
                params.set("sort", value);
                navigate(`?${params.toString()}`, { replace: true });
              }}
              style={styles.sortSelect}
            >
              <option value="priority">Sort by Priority</option>
              <option value="createdAt">Sort by Created Date</option>
            </select>
            <ChevronDown
              size={14}
              style={{ color: "#64748B", pointerEvents: "none" }}
            />
          </div>
        </div>
      )}

      {/* TASK LIST */}
      <div style={styles.taskListContainer}>
        {!selectedOrgId ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>
              <Building2Icon size={48} />
            </div>
            <h3 style={styles.emptyTitle}>No Organization Selected</h3>
            <p style={styles.emptyText}>
              Please select an organization to view and manage tasks
            </p>
          </div>
        ) : loading ? (
          <div style={styles.loadingState}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={styles.skeletonCard}>
                <div style={styles.skeletonHeader}>
                  <div style={styles.skeletonTitle} />
                  <div style={styles.skeletonBadge} />
                </div>
                <div style={styles.skeletonText} />
                <div style={styles.skeletonFooter}>
                  <div style={styles.skeletonSmall} />
                  <div style={styles.skeletonSmall} />
                </div>
              </div>
            ))}
          </div>
        ) : visibleTasks.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>
              <CheckCircle2 size={48} />
            </div>
            <h3 style={styles.emptyTitle}>No Tasks Found</h3>
            <p style={styles.emptyText}>
              {filter === "all"
                ? "Create your first task to get started"
                : `No ${filter} tasks at the moment`}
            </p>
          </div>
        ) : (
          <div style={styles.taskGrid}>
            {visibleTasks.map((t) => {
              const statusConfig = getStatusConfig(t);
              const priorityConfig = getPriorityConfig(t.priority || "medium");
              const StatusIcon = statusConfig.icon;

              return (
                <div key={t.id} style={styles.taskCard}>
                  {/* Card Header */}
                  <div style={styles.taskCardHeader}>
                    <h4 style={styles.taskTitle}>{t.title}</h4>
                    <div style={styles.taskBadges}>
                      <span
                        style={{
                          ...styles.badge,
                          backgroundColor: priorityConfig.bg,
                          color: priorityConfig.color
                        }}
                      >
                        {priorityConfig.label}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  {t.description && (
                    <p style={styles.taskDescription}>{t.description}</p>
                  )}

                  {/* Card Footer */}
                  <div style={styles.taskCardFooter}>
                    <div style={styles.taskMeta}>
                      {/* Status */}
                      <div style={styles.taskMetaItem}>
                        <StatusIcon
                          size={16}
                          style={{ color: statusConfig.color }}
                        />
                        <span
                          style={{
                            ...styles.taskMetaText,
                            color: statusConfig.color,
                            fontWeight: 500
                          }}
                        >
                          {statusConfig.label}
                        </span>
                      </div>

                      {/* Assigned To */}
                      <div style={styles.taskMetaItem}>
                        <User size={16} style={{ color: "#64748B" }} />
                        <span style={styles.taskMetaText}>
                          {getEmployeeName(t.assignedTo)}
                        </span>
                      </div>

                      {/* Deadline */}
                      {t.deadline && (
                        <div style={styles.taskMetaItem}>
                          <Clock size={16} style={{ color: "#64748B" }} />
                          <span style={styles.taskMetaText}>
                            {formatDeadline(t.deadline)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ===========================
   STYLES
=========================== */
const Building2Icon = ({ size, style }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={style}
  >
    <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
    <path d="M9 22v-4h6v4" />
    <path d="M8 6h.01" />
    <path d="M16 6h.01" />
    <path d="M12 6h.01" />
    <path d="M12 10h.01" />
    <path d="M12 14h.01" />
    <path d="M16 10h.01" />
    <path d="M16 14h.01" />
    <path d="M8 10h.01" />
    <path d="M8 14h.01" />
  </svg>
);

const styles = {
  container: {
    maxWidth: 1400,
    margin: "0 auto",
    fontFamily: "'Poppins', -apple-system, BlinkMacSystemFont, sans-serif"
  },

  loadingContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "60vh",
    color: "#0891B2"
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 32
  },

  title: {
    fontSize: 32,
    fontWeight: 700,
    color: "#0F172A",
    margin: 0,
    marginBottom: 4
  },

  subtitle: {
    fontSize: 15,
    color: "#64748B",
    margin: 0
  },

  primaryButton: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "12px 24px",
    backgroundColor: "#0891B2",
    color: "#FFFFFF",
    border: "none",
    borderRadius: 12,
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s",
    boxShadow: "0 4px 12px rgba(8, 145, 178, 0.2)"
  },

  secondaryButton: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "12px 24px",
    backgroundColor: "#FFFFFF",
    color: "#475569",
    border: "2px solid #E2E8F0",
    borderRadius: 12,
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s"
  },

  orgSelectContainer: {
    marginBottom: 24
  },

  selectWrapper: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "0 16px",
    backgroundColor: "#FFFFFF",
    border: "2px solid #E2E8F0",
    borderRadius: 12,
    maxWidth: 400
  },

  orgSelect: {
    flex: 1,
    padding: "14px 0",
    border: "none",
    outline: "none",
    fontSize: 15,
    color: "#0F172A",
    backgroundColor: "transparent",
    cursor: "pointer",
    fontFamily: "inherit"
  },

  createPanel: {
    backgroundColor: "#FFFFFF",
    border: "2px solid #E2E8F0",
    borderRadius: 16,
    padding: 32,
    marginBottom: 32,
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04)"
  },

  createPanelHeader: {
    marginBottom: 24
  },

  createPanelTitle: {
    fontSize: 20,
    fontWeight: 700,
    color: "#0F172A",
    margin: 0,
    marginBottom: 4
  },

  createPanelSubtitle: {
    fontSize: 14,
    color: "#64748B",
    margin: 0
  },

  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: 20,
    marginBottom: 24
  },

  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 8
  },

  label: {
    fontSize: 14,
    fontWeight: 600,
    color: "#334155",
    marginBottom: 4
  },

  input: {
    padding: "12px 16px",
    border: "2px solid #E2E8F0",
    borderRadius: 10,
    fontSize: 15,
    color: "#0F172A",
    outline: "none",
    transition: "all 0.2s",
    fontFamily: "inherit"
  },

  select: {
    flex: 1,
    padding: "12px 8px",
    border: "none",
    outline: "none",
    fontSize: 15,
    color: "#0F172A",
    backgroundColor: "transparent",
    cursor: "pointer",
    fontFamily: "inherit"
  },

  textarea: {
    padding: "12px 16px",
    border: "2px solid #E2E8F0",
    borderRadius: 10,
    fontSize: 15,
    color: "#0F172A",
    outline: "none",
    transition: "all 0.2s",
    fontFamily: "inherit",
    resize: "vertical",
    minHeight: 100
  },

  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "12px 16px",
    backgroundColor: "#F8FAFC",
    border: "2px solid #E2E8F0",
    borderRadius: 10,
    cursor: "pointer",
    fontSize: 14,
    color: "#334155",
    fontWeight: 500,
    marginBottom: 8
  },

  checkbox: {
    width: 18,
    height: 18,
    cursor: "pointer",
    accentColor: "#0891B2"
  },

  formActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 12,
    paddingTop: 8
  },

  controlsBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    gap: 16,
    flexWrap: "wrap"
  },

  filterTabs: {
    display: "flex",
    gap: 8,
    padding: 6,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    flexWrap: "wrap"
  },

  filterTab: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 20px",
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 600,
    color: "#64748B",
    textDecoration: "none",
    transition: "all 0.2s",
    backgroundColor: "transparent"
  },

  filterTabActive: {
    backgroundColor: "#FFFFFF",
    color: "#0891B2",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)"
  },

  filterBadge: {
    padding: "2px 8px",
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 700,
    backgroundColor: "#E2E8F0",
    color: "#64748B"
  },

  filterBadgeActive: {
    backgroundColor: "#CFFAFE",
    color: "#0891B2"
  },

  sortSelect: {
    appearance: "none",
    WebkitAppearance: "none",
    MozAppearance: "none",
    flex: 1,
    padding: "12px 8px",
    border: "none",
    outline: "none",
    fontSize: 15,
    color: "#0F172A",
    backgroundColor: "transparent",
    cursor: "pointer",
    fontFamily: "inherit"
  },

  taskListContainer: {
    minHeight: 400
  },

  taskGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))",
    gap: 20
  },

  taskCard: {
    backgroundColor: "#FFFFFF",
    border: "2px solid #E2E8F0",
    borderRadius: 16,
    padding: 24,
    transition: "all 0.2s",
    cursor: "pointer",
    position: "relative",
    overflow: "hidden"
  },

  taskCardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 12
  },

  taskTitle: {
    fontSize: 17,
    fontWeight: 700,
    color: "#0F172A",
    margin: 0,
    flex: 1,
    lineHeight: 1.4
  },

  taskBadges: {
    display: "flex",
    gap: 6,
    flexShrink: 0
  },

  badge: {
    padding: "4px 10px",
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 600,
    whiteSpace: "nowrap"
  },

  taskDescription: {
    fontSize: 14,
    color: "#64748B",
    margin: "0 0 16px 0",
    lineHeight: 1.6
  },

  taskCardFooter: {
    borderTop: "1px solid #F1F5F9",
    paddingTop: 16
  },

  taskMeta: {
    display: "flex",
    flexDirection: "column",
    gap: 10
  },

  taskMetaItem: {
    display: "flex",
    alignItems: "center",
    gap: 8
  },

  taskMetaText: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: 500
  },

  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "80px 20px",
    textAlign: "center"
  },

  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#94A3B8",
    marginBottom: 24
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: 700,
    color: "#0F172A",
    margin: "0 0 8px 0"
  },

  emptyText: {
    fontSize: 15,
    color: "#64748B",
    margin: 0,
    maxWidth: 400
  },

  loadingState: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))",
    gap: 20
  },

  skeletonCard: {
    backgroundColor: "#FFFFFF",
    border: "2px solid #E2E8F0",
    borderRadius: 16,
    padding: 24
  },

  skeletonHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16
  },

  skeletonTitle: {
    width: "60%",
    height: 20,
    backgroundColor: "#F1F5F9",
    borderRadius: 6,
    animation: "pulse 1.5s ease-in-out infinite"
  },

  skeletonBadge: {
    width: 60,
    height: 24,
    backgroundColor: "#F1F5F9",
    borderRadius: 8,
    animation: "pulse 1.5s ease-in-out infinite"
  },

  skeletonText: {
    width: "100%",
    height: 14,
    backgroundColor: "#F1F5F9",
    borderRadius: 6,
    marginBottom: 16,
    animation: "pulse 1.5s ease-in-out infinite"
  },

  skeletonFooter: {
    display: "flex",
    gap: 12,
    paddingTop: 16,
    borderTop: "1px solid #F1F5F9"
  },

  skeletonSmall: {
    width: 80,
    height: 14,
    backgroundColor: "#F1F5F9",
    borderRadius: 6,
    animation: "pulse 1.5s ease-in-out infinite"
  }
};

export default TasksPage;