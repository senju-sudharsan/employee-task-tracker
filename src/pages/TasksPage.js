import { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  getTasksByOrganization,
  createTask,
  getEmployeesByOrganization,
  createTaskForAllEmployees,
  cleanupOldCompletedTasks
} from "../services/taskService";
import { getAllOrganizations } from "../services/organizationService";
import { auth } from "../firebase";
import { getUserProfile } from "../services/authService";
import {
  Plus,
  Minus,
  Filter,
  Clock,
  AlertCircle,
  CheckCircle2,
  Circle,
  ChevronDown,
  Calendar,
  User,
  Loader2,
  Users,
  X,
  Check,
  Building2,
  ArrowUpDown
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
const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

/* ===========================
   CUSTOM DROPDOWN COMPONENT
=========================== */
function CustomSelect({ value, onChange, options, placeholder, icon: Icon, disabled }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => !disabled && setOpen(!open)}
        style={{
          ...cStyles.dropBtn,
          opacity: disabled ? 0.5 : 1,
          cursor: disabled ? "not-allowed" : "pointer",
          borderColor: open ? "#F59E0B" : "#E2E8F0",
          boxShadow: open ? "0 0 0 3px rgba(245,158,11,0.12)" : "none"
        }}
      >
        <span style={cStyles.dropBtnLeft}>
          {Icon && (
            <Icon
              size={16}
              style={{
                color: open ? "#F59E0B" : "#94A3B8",
                flexShrink: 0,
                transition: "color 0.2s"
              }}
            />
          )}
          <span
            style={{
              color: selected ? "#0F172A" : "#94A3B8",
              fontSize: 14,
              fontWeight: selected ? 500 : 400
            }}
          >
            {selected ? selected.label : placeholder}
          </span>
        </span>
        <ChevronDown
          size={15}
          style={{
            color: "#94A3B8",
            transition: "transform 0.2s",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            flexShrink: 0
          }}
        />
      </button>

      {open && (
        <div style={cStyles.dropMenu}>
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              style={{
                ...cStyles.dropItem,
                backgroundColor: opt.value === value ? "#FFF7ED" : "transparent",
                color: opt.value === value ? "#EA580C" : "#334155"
              }}
            >
              {opt.dot && (
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    backgroundColor: opt.dot,
                    flexShrink: 0
                  }}
                />
              )}
              <span style={{ flex: 1, textAlign: "left" }}>{opt.label}</span>
              {opt.value === value && (
                <Check size={14} style={{ color: "#EA580C", flexShrink: 0 }} />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ===========================
   EMPLOYEE MULTI-SELECT COMPONENT
=========================== */
function EmployeeMultiSelect({ employees, selectedEmployees, onChange }) {
  const [search, setSearch] = useState("");

  const filtered = employees.filter((e) =>
    (e.name || e.email || "").toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (uid) => {
    if (selectedEmployees.includes(uid)) {
      onChange(selectedEmployees.filter((id) => id !== uid));
    } else {
      onChange([...selectedEmployees, uid]);
    }
  };

  const selectAll = () => onChange(employees.map((e) => e.uid));
  const clearAll = () => onChange([]);

  const getInitials = (emp) => {
    const name = emp.name || emp.email || "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <div style={cStyles.empBox}>
      {/* Search + quick actions */}
      <div style={cStyles.empSearchRow}>
        <div style={cStyles.empSearchWrap}>
          <User size={14} style={{ color: "#94A3B8", flexShrink: 0 }} />
          <input
            placeholder="Search employees..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={cStyles.empSearch}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              style={cStyles.empSearchClear}
            >
              <X size={12} />
            </button>
          )}
        </div>
        <div style={cStyles.empQuickActions}>
          <button type="button" onClick={selectAll} style={cStyles.empQuickBtn}>
            All
          </button>
          <button type="button" onClick={clearAll} style={cStyles.empQuickBtn}>
            Clear
          </button>
        </div>
      </div>

      {/* Employee list */}
      <div style={cStyles.empList}>
        {filtered.length === 0 ? (
          <div style={cStyles.empEmpty}>No employees found</div>
        ) : (
          filtered.map((emp) => {
            const isSelected = selectedEmployees.includes(emp.uid);
            return (
              <button
                key={emp.uid}
                type="button"
                onClick={() => toggle(emp.uid)}
                style={{
                  ...cStyles.empRow,
                  backgroundColor: isSelected ? "#FFF7ED" : "transparent",
                  borderColor: isSelected ? "#FED7AA" : "transparent"
                }}
              >
                {/* Avatar */}
                <div
                  style={{
                    ...cStyles.empAvatar,
                    background: isSelected
                      ? "linear-gradient(135deg, #F59E0B, #EA580C)"
                      : "#F1F5F9",
                    color: isSelected ? "#fff" : "#64748B"
                  }}
                >
                  {getInitials(emp)}
                </div>
                {/* Info */}
                <div style={cStyles.empInfo}>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: isSelected ? "#EA580C" : "#0F172A"
                    }}
                  >
                    {emp.name || emp.email}
                  </span>
                  {emp.name && emp.email && (
                    <span style={{ fontSize: 11, color: "#94A3B8" }}>{emp.email}</span>
                  )}
                </div>
                {/* Checkbox */}
                <div
                  style={{
                    ...cStyles.empCheckbox,
                    backgroundColor: isSelected ? "#EA580C" : "#fff",
                    borderColor: isSelected ? "#EA580C" : "#CBD5E1"
                  }}
                >
                  {isSelected && <Check size={10} color="#fff" strokeWidth={3} />}
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Footer: selected pills */}
      {selectedEmployees.length > 0 && (
        <div style={cStyles.empFooter}>
          <div style={cStyles.empSelectedPills}>
            {selectedEmployees.slice(0, 3).map((uid) => {
              const emp = employees.find((e) => e.uid === uid);
              return emp ? (
                <span key={uid} style={cStyles.empPill}>
                  {emp.name || emp.email}
                  <button
                    type="button"
                    onClick={() => toggle(uid)}
                    style={cStyles.empPillX}
                  >
                    <X size={10} />
                  </button>
                </span>
              ) : null;
            })}
            {selectedEmployees.length > 3 && (
              <span
                style={{
                  ...cStyles.empPill,
                  backgroundColor: "#F1F5F9",
                  color: "#64748B"
                }}
              >
                +{selectedEmployees.length - 3} more
              </span>
            )}
          </div>
          <span style={cStyles.empCount}>{selectedEmployees.length} selected</span>
        </div>
      )}
    </div>
  );
}

/* ===========================
   MAIN PAGE
=========================== */
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
  const [selectedEmployees, setSelectedEmployees] = useState([]);
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
      await cleanupOldCompletedTasks();
      const p = await getUserProfile(auth.currentUser.uid);
      setProfile(p);

      if (p.role === "super_admin") {
        const orgs = await getAllOrganizations();
        setOrganizations(orgs || []);
        if (orgFromUrl) setSelectedOrgId(orgFromUrl);
      } else {
        setSelectedOrgId(p.organizationId);
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

  useEffect(() => {
    if (orgFromUrl && orgFromUrl !== selectedOrgId) setSelectedOrgId(orgFromUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgFromUrl]);

  useEffect(() => {
    if (sortFromUrl !== sortBy) setSortBy(sortFromUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortFromUrl]);

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
    if (!assignAll && selectedEmployees.length === 0) {
      alert("Please select at least one employee or assign to all");
      return;
    }
    if (assignAll && employees.length === 0) {
      alert("This organization has no employees");
      return;
    }
    if (deadline && new Date(deadline) < new Date()) {
      alert("Deadline cannot be in the past");
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
      for (let uid of selectedEmployees) {
        await createTask({
          title,
          description,
          priority,
          assignedTo: uid,
          organizationId: selectedOrgId,
          deadline: deadline ? new Date(deadline) : null
        });
      }
    }

    setTitle("");
    setDescription("");
    setPriority("medium");
    setSelectedEmployees([]);
    setAssignAll(false);
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
     STRICT 7-DAY WINDOW + FILTER + SORT
  =========================== */
  const visibleTasks = tasks
    .filter((t) => {
      if (t.status !== "Done") {
        if (!t.createdAt) return false;
        const created =
          typeof t.createdAt.toDate === "function"
            ? t.createdAt.toDate()
            : new Date(t.createdAt);
        if (created < sevenDaysAgo) return false;
      } else {
        if (!t.completedAt) return false;
        const completed =
          typeof t.completedAt.toDate === "function"
            ? t.completedAt.toDate()
            : new Date(t.completedAt);
        if (completed < sevenDaysAgo) return false;
      }
      if (filter === "completed") return t.status === "Done" && !t.completedLate;
      if (filter === "pending") return t.status !== "Done";
      if (filter === "overdue") return isTaskOverdue(t);
      if (filter === "completed-late") return t.status === "Done" && t.completedLate === true;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "priority") return priorityRank[a.priority] - priorityRank[b.priority];
      if (sortBy === "createdAt") {
        if (a.status !== "Done" && b.status !== "Done")
          return (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0);
        return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
      }
      return 0;
    });

  /* ===========================
     HELPER FUNCTIONS
  =========================== */
  const getStatusConfig = (task) => {
    if (task.status === "Done" && task.completedLate === true)
      return { label: "Completed Late", color: "#F59E0B", bg: "#FEF3C7", icon: Clock };
    if (isTaskOverdue(task))
      return { label: "Overdue", color: "#EF4444", bg: "#FEE2E2", icon: AlertCircle };
    if (task.status === "Done")
      return { label: "Completed", color: "#22C55E", bg: "#DCFCE7", icon: CheckCircle2 };
    return { label: "In Progress", color: "#FACC15", bg: "#FEF9C3", icon: Circle };
  };

  const getPriorityConfig = (p) => {
    const configs = {
      high: { label: "High", color: "#EF4444", bg: "#FEE2E2" },
      medium: { label: "Medium", color: "#F59E0B", bg: "#FEF3C7" },
      low: { label: "Low", color: "#38BDF8", bg: "#E0F2FE" }
    };
    return configs[p] || configs.medium;
  };

  const formatDeadline = (dl) => {
    if (!dl) return null;
    const d = typeof dl.toDate === "function" ? dl.toDate() : new Date(dl);
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

  const weekTasks = tasks.filter((t) => {
    if (t.status !== "Done") {
      if (!t.createdAt) return false;
      const created =
        typeof t.createdAt.toDate === "function"
          ? t.createdAt.toDate()
          : new Date(t.createdAt);
      return created >= sevenDaysAgo;
    } else {
      if (!t.completedAt) return false;
      const completed =
        typeof t.completedAt.toDate === "function"
          ? t.completedAt.toDate()
          : new Date(t.completedAt);
      return completed >= sevenDaysAgo;
    }
  });

  const filterCounts = {
    all: weekTasks.length,
    pending: weekTasks.filter((t) => t.status !== "Done").length,
    completed: weekTasks.filter((t) => t.status === "Done" && !t.completedLate).length,
    overdue: weekTasks.filter((t) => isTaskOverdue(t)).length,
    "completed-late": weekTasks.filter(
      (t) => t.status === "Done" && t.completedLate === true
    ).length
  };

  // Dropdown option arrays
  const orgOptions = organizations.map((o) => ({ value: o.id, label: o.name }));
  const priorityOptions = [
    { value: "high", label: "High Priority", dot: "#EF4444" },
    { value: "medium", label: "Medium Priority", dot: "#F59E0B" },
    { value: "low", label: "Low Priority", dot: "#38BDF8" }
  ];
  const sortOptions = [
    { value: "priority", label: "Sort by Priority" },
    { value: "createdAt", label: "Sort by Created Date" }
  ];

  if (!profile)
    return (
      <div style={styles.loadingContainer}>
        <Loader2
          size={32}
          style={{ animation: "spin 1s linear infinite", color: "#F59E0B" }}
        />
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
              opacity: showCreatePanel ? 0.85 : 1
            }}
          >
            {showCreatePanel ? <Minus size={18} /> : <Plus size={18} />}
            {showCreatePanel ? "Cancel" : "Create Task"}
          </button>
        )}
      </div>

      {/* SUPER ADMIN ORG SELECT */}
      {profile.role === "super_admin" && (
        <div style={styles.orgSelectContainer}>
          <CustomSelect
            value={selectedOrgId}
            onChange={handleOrgChange}
            options={orgOptions}
            placeholder="Select an organization"
            icon={Building2}
            disabled={loading}
          />
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
              <CustomSelect
                value={priority}
                onChange={setPriority}
                options={priorityOptions}
                placeholder="Select priority"
                icon={AlertCircle}
              />
            </div>

            {/* Deadline */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Deadline</label>
              <div style={{ position: "relative" }}>
                <Calendar
                  size={16}
                  style={{
                    position: "absolute",
                    left: 14,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#94A3B8",
                    pointerEvents: "none",
                    zIndex: 1
                  }}
                />
                <input
                  type="datetime-local"
                  value={deadline}
                  min={new Date().toISOString().slice(0, 16)}
                  onChange={(e) => setDeadline(e.target.value)}
                  style={{ ...styles.input, paddingLeft: 40 }}
                />
              </div>
            </div>

            {/* Assignment — full width */}
            <div style={{ ...styles.formGroup, gridColumn: "1 / -1" }}>
              <label style={styles.label}>Assign To</label>

              {/* Assign-all toggle */}
              <button
                type="button"
                onClick={() => {
                  setAssignAll(!assignAll);
                  setSelectedEmployees([]);
                }}
                style={{
                  ...cStyles.assignAllBtn,
                  borderColor: assignAll ? "#FED7AA" : "#E2E8F0",
                  backgroundColor: assignAll ? "#FFF7ED" : "#F8FAFC"
                }}
              >
                <div
                  style={{
                    ...cStyles.assignAllCheck,
                    backgroundColor: assignAll ? "#EA580C" : "#fff",
                    borderColor: assignAll ? "#EA580C" : "#CBD5E1"
                  }}
                >
                  {assignAll && <Check size={11} color="#fff" strokeWidth={3} />}
                </div>
                <Users
                  size={15}
                  style={{
                    color: assignAll ? "#EA580C" : "#64748B",
                    flexShrink: 0
                  }}
                />
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: assignAll ? "#EA580C" : "#334155"
                  }}
                >
                  Assign to all employees
                </span>
                {assignAll && (
                  <span style={cStyles.assignAllBadge}>
                    {employees.length} people
                  </span>
                )}
              </button>

              {!assignAll && (
                <EmployeeMultiSelect
                  employees={employees}
                  selectedEmployees={selectedEmployees}
                  onChange={setSelectedEmployees}
                />
              )}
            </div>

            {/* Description — full width */}
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
              <Minus size={16} />
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
          {[
            { key: "all", label: "All Tasks" },
            { key: "pending", label: "Pending" },
            { key: "completed", label: "Completed This Week" },
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

          {/* Sort — custom dropdown */}
          <div style={{ minWidth: 210 }}>
            <CustomSelect
              value={sortBy}
              onChange={(value) => {
                setSortBy(value);
                const params = new URLSearchParams(location.search);
                params.set("sort", value);
                navigate(`?${params.toString()}`, { replace: true });
              }}
              options={sortOptions}
              placeholder="Sort by..."
              icon={ArrowUpDown}
            />
          </div>
        </div>
      )}

      {/* TASK LIST */}
      <div style={styles.taskListContainer}>
        {!selectedOrgId ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>
              <Building2 size={48} />
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
                : `No ${filter} tasks this week`}
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

                  {t.description && (
                    <p style={styles.taskDescription}>{t.description}</p>
                  )}

                  <div style={styles.taskCardFooter}>
                    <div style={styles.taskMeta}>
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

                      <div style={styles.taskMetaItem}>
                        <User size={16} style={{ color: "#64748B" }} />
                        <span style={styles.taskMetaText}>
                          {getEmployeeName(t.assignedTo)}
                        </span>
                      </div>

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
   COMPONENT STYLES
=========================== */
const cStyles = {
  /* Custom dropdown */
  dropBtn: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    padding: "11px 14px",
    backgroundColor: "#FFFFFF",
    border: "2px solid #E2E8F0",
    borderRadius: 10,
    transition: "all 0.2s",
    fontFamily: "'Poppins', -apple-system, BlinkMacSystemFont, sans-serif",
    boxSizing: "border-box"
  },

  dropBtnLeft: {
    display: "flex",
    alignItems: "center",
    gap: 9,
    minWidth: 0,
    overflow: "hidden"
  },

  dropMenu: {
    position: "absolute",
    top: "calc(100% + 6px)",
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    border: "2px solid #E2E8F0",
    borderRadius: 12,
    boxShadow: "0 8px 30px rgba(0,0,0,0.10)",
    zIndex: 999,
    padding: "4px",
    overflow: "hidden"
  },

  dropItem: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 12px",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 500,
    transition: "background 0.15s",
    fontFamily: "'Poppins', -apple-system, BlinkMacSystemFont, sans-serif",
    boxSizing: "border-box"
  },

  /* Employee multi-select */
  empBox: {
    border: "2px solid #E2E8F0",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
    marginTop: 4
  },

  empSearchRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 12px",
    borderBottom: "1px solid #F1F5F9",
    backgroundColor: "#F8FAFC"
  },

  empSearchWrap: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFFFFF",
    border: "1.5px solid #E2E8F0",
    borderRadius: 8,
    padding: "6px 10px"
  },

  empSearch: {
    flex: 1,
    border: "none",
    outline: "none",
    fontSize: 13,
    color: "#0F172A",
    backgroundColor: "transparent",
    fontFamily: "'Poppins', -apple-system, BlinkMacSystemFont, sans-serif"
  },

  empSearchClear: {
    border: "none",
    background: "none",
    cursor: "pointer",
    color: "#94A3B8",
    padding: 0,
    display: "flex",
    alignItems: "center"
  },

  empQuickActions: {
    display: "flex",
    gap: 4
  },

  empQuickBtn: {
    padding: "5px 10px",
    border: "1.5px solid #E2E8F0",
    borderRadius: 7,
    backgroundColor: "#FFFFFF",
    fontSize: 11,
    fontWeight: 700,
    color: "#64748B",
    cursor: "pointer",
    transition: "all 0.15s",
    fontFamily: "'Poppins', -apple-system, BlinkMacSystemFont, sans-serif",
    letterSpacing: "0.04em",
    textTransform: "uppercase"
  },

  empList: {
    maxHeight: 200,
    overflowY: "auto",
    padding: "6px"
  },

  empEmpty: {
    padding: "24px 12px",
    textAlign: "center",
    fontSize: 13,
    color: "#94A3B8"
  },

  empRow: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "8px 10px",
    border: "1.5px solid transparent",
    borderRadius: 9,
    cursor: "pointer",
    transition: "all 0.15s",
    textAlign: "left",
    fontFamily: "'Poppins', -apple-system, BlinkMacSystemFont, sans-serif",
    marginBottom: 2,
    boxSizing: "border-box"
  },

  empAvatar: {
    width: 32,
    height: 32,
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 11,
    fontWeight: 700,
    flexShrink: 0,
    transition: "all 0.15s"
  },

  empInfo: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 1,
    minWidth: 0
  },

  empCheckbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    border: "2px solid",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    transition: "all 0.15s"
  },

  empFooter: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "8px 12px",
    borderTop: "1px solid #F1F5F9",
    backgroundColor: "#FAFAFA"
  },

  empSelectedPills: {
    display: "flex",
    flexWrap: "wrap",
    gap: 4,
    flex: 1
  },

  empPill: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    padding: "3px 8px",
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 600,
    backgroundColor: "#FEF3C7",
    color: "#92400E"
  },

  empPillX: {
    border: "none",
    background: "none",
    cursor: "pointer",
    padding: 0,
    color: "#92400E",
    display: "flex",
    alignItems: "center"
  },

  empCount: {
    fontSize: 11,
    fontWeight: 700,
    color: "#EA580C",
    flexShrink: 0,
    marginLeft: 8
  },

  /* Assign-all toggle */
  assignAllBtn: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "11px 14px",
    border: "2px solid",
    borderRadius: 10,
    cursor: "pointer",
    transition: "all 0.2s",
    marginBottom: 10,
    fontFamily: "'Poppins', -apple-system, BlinkMacSystemFont, sans-serif",
    boxSizing: "border-box"
  },

  assignAllCheck: {
    width: 18,
    height: 18,
    borderRadius: 5,
    border: "2px solid",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.15s",
    flexShrink: 0
  },

  assignAllBadge: {
    marginLeft: "auto",
    padding: "2px 8px",
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 700,
    backgroundColor: "#FEF3C7",
    color: "#92400E"
  }
};

/* ===========================
   PAGE STYLES
=========================== */
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
    minHeight: "60vh"
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
    background: "linear-gradient(135deg, #F59E0B, #EA580C)",
    color: "#FFFFFF",
    border: "none",
    borderRadius: 12,
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s",
    boxShadow: "0 4px 12px rgba(245, 158, 11, 0.3)",
    fontFamily: "'Poppins', -apple-system, BlinkMacSystemFont, sans-serif"
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
    transition: "all 0.2s",
    fontFamily: "'Poppins', -apple-system, BlinkMacSystemFont, sans-serif"
  },

  orgSelectContainer: {
    marginBottom: 24,
    maxWidth: 400
  },

  createPanel: {
    backgroundColor: "#FFFFFF",
    border: "2px solid #E2E8F0",
    borderRadius: 16,
    padding: 32,
    marginBottom: 32,
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04)"
  },

  createPanelHeader: { marginBottom: 24 },

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
    padding: "11px 14px",
    border: "2px solid #E2E8F0",
    borderRadius: 10,
    fontSize: 14,
    color: "#0F172A",
    outline: "none",
    transition: "all 0.2s",
    fontFamily: "'Poppins', -apple-system, BlinkMacSystemFont, sans-serif",
    width: "100%",
    boxSizing: "border-box"
  },

  textarea: {
    padding: "12px 14px",
    border: "2px solid #E2E8F0",
    borderRadius: 10,
    fontSize: 14,
    color: "#0F172A",
    outline: "none",
    transition: "all 0.2s",
    fontFamily: "'Poppins', -apple-system, BlinkMacSystemFont, sans-serif",
    resize: "vertical",
    minHeight: 100,
    width: "100%",
    boxSizing: "border-box"
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
    color: "#EA580C",
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
    backgroundColor: "#FEF3C7",
    color: "#EA580C"
  },

  taskListContainer: { minHeight: 400 },

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

  taskBadges: { display: "flex", gap: 6, flexShrink: 0 },

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

  taskMeta: { display: "flex", flexDirection: "column", gap: 10 },
  taskMetaItem: { display: "flex", alignItems: "center", gap: 8 },
  taskMetaText: { fontSize: 13, color: "#64748B", fontWeight: 500 },

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

  emptyTitle: { fontSize: 20, fontWeight: 700, color: "#0F172A", margin: "0 0 8px 0" },
  emptyText: { fontSize: 15, color: "#64748B", margin: 0, maxWidth: 400 },

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

  skeletonTitle: { width: "60%", height: 20, backgroundColor: "#F1F5F9", borderRadius: 6 },
  skeletonBadge: { width: 60, height: 24, backgroundColor: "#F1F5F9", borderRadius: 8 },
  skeletonText: {
    width: "100%",
    height: 14,
    backgroundColor: "#F1F5F9",
    borderRadius: 6,
    marginBottom: 16
  },
  skeletonFooter: {
    display: "flex",
    gap: 12,
    paddingTop: 16,
    borderTop: "1px solid #F1F5F9"
  },
  skeletonSmall: { width: 80, height: 14, backgroundColor: "#F1F5F9", borderRadius: 6 }
};

export default TasksPage;