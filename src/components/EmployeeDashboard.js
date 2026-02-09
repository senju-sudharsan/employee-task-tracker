import { useEffect, useState } from "react";
import { auth } from "../firebase";

import {
  getTasksByEmployee,
  updateTaskStatus,
  acknowledgeTask,
  listenToTasksByEmployee,
} from "../services/taskService";


function EmployeeDashboard({ currentUser }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
  if (!auth.currentUser) return;

  const unsubscribe = listenToTasksByEmployee(
    auth.currentUser.uid,
    (data) => {
      setTasks(data || []);
      setLoading(false);
    }
  );

  return () => unsubscribe();
}, []);


  const loadTasks = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    const data = await getTasksByEmployee(auth.currentUser.uid);
    setTasks(data || []);
    setLoading(false);
  };

  const isOverdue = (task) => {
    if (!task.deadline || task.status === "Done") return false;
    const d =
      typeof task.deadline.toDate === "function"
        ? task.deadline.toDate()
        : new Date(task.deadline);
    return d < new Date();
  };

  const act = async (fn, id) => {
    setSavingId(id);
    await fn(id);
    await loadTasks();
    setSavingId(null);
  };

  const getFilteredTasks = () => {
    switch (filter) {
      case "pending":
        return tasks.filter(t => t.status !== "Done");
      case "completed":
        return tasks.filter(t => t.status === "Done" && !t.completedLate);
      case "completed-late":
        return tasks.filter(t => t.status === "Done" && t.completedLate === true);
      case "overdue":
        return tasks.filter(t => isOverdue(t));
      default:
        return tasks;
    }
  };

  const filteredTasks = getFilteredTasks();

  const metrics = {
    total: tasks.length,
    pending: tasks.filter(t => t.status !== "Done").length,
    completed: tasks.filter(t => t.status === "Done" && !t.completedLate).length,
    completedLate: tasks.filter(t => t.status === "Done" && t.completedLate === true).length,
    overdue: tasks.filter(t => isOverdue(t)).length
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return "#EF4444";
      case "medium":
        return "#FACC15";
      case "low":
        return "#38BDF8";
      default:
        return "#64748B";
    }
  };

  const getStatusBadgeColor = (task) => {
    if (task.status === "Done" && task.completedLate === true) {
      return { bg: "#FEF3C7", text: "#F59E0B", label: "Completed Late" };
    }
    if (task.status === "Done") {
      return { bg: "#F0FDF4", text: "#22C55E", label: "Completed" };
    }
    if (isOverdue(task)) {
      return { bg: "#FEF2F2", text: "#EF4444", label: "Overdue" };
    }
    return { bg: "#FEFCE8", text: "#FACC15", label: "In Progress" };
  };

  const formatDate = (deadline) => {
    if (!deadline) return "No deadline";
    const d = typeof deadline.toDate === "function" ? deadline.toDate() : new Date(deadline);
    const now = new Date();
    const diff = d - now;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days < 0) return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (days === 0) return "Today";
    if (days === 1) return "Tomorrow";
    if (days < 7) return `${days} days`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div className="loading-spinner"></div>
        <p style={styles.loadingText}>Loading your tasks...</p>
      </div>
    );
  }

  const displayName = currentUser?.name || currentUser?.email || "Employee";

  return (
    <div style={styles.container}>
      <div style={styles.header} className="hero-fade-in">
        <div style={styles.heroGlow}></div>
        <div style={styles.headerContent}>
          <div style={styles.headerLeft}>
            <div style={styles.welcomeBadge}>
              <div style={styles.welcomeDot} />
              <span>EMPLOYEE</span>
            </div>
            <h1 style={styles.title}>Welcome, {displayName}</h1>
            <p style={styles.subtitle}>Manage and track your assigned tasks</p>
          </div>
          <div style={styles.headerRight}>
            <div style={styles.liveIndicator}>
              <div style={styles.liveDot} />
              <span style={styles.liveText}>Live Data</span>
            </div>
          </div>
        </div>
      </div>

      <div style={styles.metricsGrid} className="metrics-fade-in">
        {[
          { label: "Total Tasks", value: metrics.total, color: "#38BDF8", gradient: "linear-gradient(135deg, #38BDF8 0%, #0891B2 100%)" },
          { label: "In Progress", value: metrics.pending, color: "#FACC15", gradient: "linear-gradient(135deg, #FACC15 0%, #F59E0B 100%)" },
          { label: "Completed", value: metrics.completed, color: "#22C55E", gradient: "linear-gradient(135deg, #22C55E 0%, #16A34A 100%)" },
          { label: "Completed Late", value: metrics.completedLate, color: "#F59E0B", gradient: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)" },
          { label: "Overdue", value: metrics.overdue, color: "#EF4444", gradient: "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)" }
        ].map((metric, idx) => (
          <MetricCard key={idx} {...metric} />
        ))}
      </div>

      <div style={styles.filterSection} className="section-fade-in">
        <div style={styles.filterButtons}>
          {[
            { key: "all", label: "All Tasks" },
            { key: "pending", label: "In Progress" },
            { key: "completed", label: "Completed" },
            { key: "completed-late", label: "Completed Late" },
            { key: "overdue", label: "Overdue" }
          ].map(({ key, label }) => (
            <button
              key={key}
              style={{
                ...styles.filterButton,
                ...(filter === key ? styles.filterButtonActive : {})
              }}
              onClick={() => setFilter(key)}
              className="filter-btn"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {filteredTasks.length === 0 ? (
        <div style={styles.emptyState} className="section-fade-in">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" style={styles.emptyIcon}>
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <p style={styles.emptyTitle}>No tasks found</p>
          <p style={styles.emptySubtext}>
            {filter === "all" ? "You have no tasks assigned yet" : `No ${filter} tasks`}
          </p>
        </div>
      ) : (
        <div style={styles.tasksList} className="section-fade-in">
          {filteredTasks.map((task, idx) => {
            const overdue = isOverdue(task);
            const statusBadge = getStatusBadgeColor(task);
            const isSaving = savingId === task.id;

            return (
              <div key={task.id} style={styles.taskCard} className="task-card">
                <div style={styles.taskHeader}>
                  <div style={styles.taskHeaderLeft}>
                    <h3 style={styles.taskTitle}>{task.title}</h3>
                    <div style={styles.badgeGroup}>
                      <span 
                        style={{
                          ...styles.statusBadge,
                          backgroundColor: statusBadge.bg,
                          color: statusBadge.text
                        }}
                      >
                        {statusBadge.label}
                      </span>
                      {task.priority && (
                        <span 
                          style={{
                            ...styles.priorityBadge,
                            borderColor: getPriorityColor(task.priority),
                            color: getPriorityColor(task.priority)
                          }}
                        >
                          {task.priority}
                        </span>
                      )}
                      {!task.acknowledged && (
                        <span style={styles.newBadge}>
                          New
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={styles.taskHeaderRight}>
                    {task.deadline && (
                      <div style={{
                        ...styles.deadlineChip,
                        ...(overdue ? styles.deadlineChipOverdue : {})
                      }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{flexShrink: 0}}>
                          <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span>{formatDate(task.deadline)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {task.description && (
                  <p style={styles.taskDescription}>{task.description}</p>
                )}

                <div style={styles.taskFooter}>
                  <div style={styles.taskActions}>
                    {!task.acknowledged && (
                      <button
                        disabled={isSaving}
                        onClick={() => act(acknowledgeTask, task.id)}
                        style={{
                          ...styles.actionButton,
                          ...styles.acknowledgeButton,
                          ...(isSaving ? styles.actionButtonDisabled : {})
                        }}
                        className="action-button"
                      >
                        {isSaving ? (
                          <>
                            <div className="button-spinner"></div>
                            <span>Processing...</span>
                          </>
                        ) : (
                          <>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            <span>Acknowledge</span>
                          </>
                        )}
                      </button>
                    )}
                    {task.status !== "Done" && (
                      <button
                        disabled={isSaving}
                        onClick={() => act((id) => updateTaskStatus(id, "Done"), task.id)}
                        style={{
                          ...styles.actionButton,
                          ...styles.completeButton,
                          ...(isSaving ? styles.actionButtonDisabled : {})
                        }}
                        className="action-button complete-btn"
                      >
                        {isSaving ? (
                          <>
                            <div className="button-spinner"></div>
                            <span>Processing...</span>
                          </>
                        ) : (
                          <>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                              <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            <span>Mark Complete</span>
                          </>
                        )}
                      </button>
                    )}
                    {task.status === "Done" && (
                      <div style={styles.completedIndicator}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span>Task Completed</span>
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
  );
}

function MetricCard({ label, value, color, gradient }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        ...styles.metricCard,
        transform: isHovered ? 'translateY(-6px) scale(1.02)' : 'translateY(0) scale(1)',
        boxShadow: isHovered 
          ? `0 16px 32px rgba(0, 0, 0, 0.1), 0 0 0 3px ${color}20, 0 0 16px ${color}30`
          : '0 2px 8px rgba(0, 0, 0, 0.06)',
      }}
      className="metric-card"
    >
      <div style={styles.metricGlow} className={isHovered ? "metric-glow-active" : ""}></div>
      <div style={styles.metricContent}>
        <span style={styles.metricLabel}>{label}</span>
        <span style={{
          ...styles.metricValue, 
          background: isHovered ? gradient : "transparent",
          WebkitBackgroundClip: isHovered ? "text" : "unset",
          WebkitTextFillColor: isHovered ? "transparent" : color,
          backgroundClip: isHovered ? "text" : "unset"
        }}>
          {value}
        </span>
      </div>
    </div>
  );
}

const styles = {
  container: {
    fontFamily: "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    backgroundColor: "#FEFCF9",
    minHeight: "100vh",
    display: 'flex',
    flexDirection: 'column',
    gap: 48,
    maxWidth: 1440,
    margin: "0 auto",
    padding: "0 32px 80px",
  },
  header: {
    position: "relative",
    display: 'flex',
    flexDirection: 'column',
    padding: '56px 56px',
    background: "linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)",
    borderRadius: 20,
    border: '1px solid rgba(226, 232, 240, 0.8)',
    overflow: "hidden",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.06)",
  },
  heroGlow: {
    position: "absolute",
    top: -80,
    right: -80,
    width: 350,
    height: 350,
    background: "radial-gradient(circle, rgba(34, 197, 94, 0.12) 0%, transparent 70%)",
    borderRadius: "50%",
    pointerEvents: "none",
  },
  headerContent: {
    position: "relative",
    zIndex: 1,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerLeft: {
    flex: 1,
  },
  welcomeBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 9,
    padding: '9px 20px',
    background: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)',
    borderRadius: 100,
    marginBottom: 24,
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: '1.1px',
    textTransform: 'uppercase',
    color: '#15803D',
    boxShadow: '0 4px 12px rgba(21, 128, 61, 0.15)',
  },
  welcomeDot: {
    width: 7,
    height: 7,
    borderRadius: '50%',
    background: '#15803D',
    boxShadow: '0 0 8px rgba(21, 128, 61, 0.5)',
  },
  title: {
    fontSize: 50,
    fontWeight: 800,
    color: "#0F172A",
    margin: 0,
    marginBottom: 14,
    letterSpacing: "-1.3px",
    lineHeight: 1.1,
  },
  subtitle: {
    fontSize: 17,
    color: "#64748B",
    margin: 0,
    fontWeight: 500,
    lineHeight: 1.6,
  },
  headerRight: {
    paddingTop: 10,
  },
  liveIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: 9,
    padding: '11px 20px',
    background: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)',
    borderRadius: 100,
    border: '1px solid rgba(34, 197, 94, 0.2)',
    boxShadow: '0 4px 12px rgba(34, 197, 94, 0.15)',
  },
  liveDot: {
    width: 9,
    height: 9,
    borderRadius: '50%',
    background: '#22C55E',
    boxShadow: '0 0 0 3px rgba(34, 197, 94, 0.2)',
    animation: 'pulse-glow 2s ease-in-out infinite',
  },
  liveText: {
    fontSize: 13,
    fontWeight: 700,
    color: '#16A34A',
  },
  metricsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(5, 1fr)",
    gap: 24,
  },
  metricCard: {
    position: "relative",
    padding: 28,
    background: "#FFFFFF",
    borderRadius: 16,
    border: "1px solid #E5E7EB",
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: 'pointer',
    overflow: "hidden",
  },
  metricGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "radial-gradient(circle at top right, rgba(56, 189, 248, 0.08) 0%, transparent 70%)",
    opacity: 0,
    transition: "opacity 0.4s ease",
    pointerEvents: "none",
  },
  metricContent: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    position: "relative",
    zIndex: 1,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: 700,
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: '0.7px',
  },
  metricValue: {
    fontSize: 42,
    fontWeight: 800,
    letterSpacing: '-1.8px',
    transition: 'all 0.4s ease',
  },
  filterSection: {
    marginBottom: 0,
  },
  filterButtons: {
    display: "flex",
    gap: 14,
    flexWrap: "wrap"
  },
  filterButton: {
    padding: "13px 26px",
    borderRadius: 12,
    border: "1px solid #E2E8F0",
    backgroundColor: "#FFFFFF",
    color: "#64748B",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    fontFamily: "'Poppins', sans-serif"
  },
  filterButtonActive: {
    backgroundColor: "#38BDF8",
    color: "#FFFFFF",
    borderColor: "#38BDF8",
    boxShadow: '0 4px 16px rgba(56, 189, 248, 0.35)',
    transform: "translateY(-2px)",
  },
  tasksList: {
    display: "flex",
    flexDirection: "column",
    gap: 20
  },
  taskCard: {
    backgroundColor: "#FFFFFF",
    padding: 32,
    borderRadius: 16,
    border: "1px solid #E5E7EB",
    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
  },
  taskHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 18,
    gap: 18,
    flexWrap: "wrap"
  },
  taskHeaderLeft: {
    flex: 1,
    minWidth: 0
  },
  taskTitle: {
    fontSize: 20,
    fontWeight: 700,
    color: "#0F172A",
    margin: "0 0 14px 0",
    letterSpacing: "-0.4px"
  },
  badgeGroup: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    alignItems: "center"
  },
  statusBadge: {
    padding: "7px 16px",
    borderRadius: 9,
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: "0.3px"
  },
  priorityBadge: {
    padding: "7px 16px",
    borderRadius: 9,
    fontSize: 13,
    fontWeight: 600,
    border: "1.5px solid",
    backgroundColor: "transparent",
    letterSpacing: "0.3px"
  },
  newBadge: {
    padding: "7px 14px",
    borderRadius: 9,
    fontSize: 11,
    fontWeight: 700,
    backgroundColor: "#DBEAFE",
    color: "#1D4ED8",
    letterSpacing: "0.6px",
    textTransform: "uppercase"
  },
  taskHeaderRight: {
    display: "flex",
    alignItems: "center",
    gap: 10
  },
  deadlineChip: {
    display: "flex",
    alignItems: "center",
    gap: 9,
    padding: "9px 16px",
    borderRadius: 10,
    backgroundColor: "#F8FAFC",
    color: "#64748B",
    fontSize: 13,
    fontWeight: 600
  },
  deadlineChipOverdue: {
    backgroundColor: "#FEF2F2",
    color: "#EF4444"
  },
  taskDescription: {
    fontSize: 15,
    color: "#64748B",
    lineHeight: 1.7,
    margin: "0 0 22px 0"
  },
  taskFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 22,
    borderTop: "1px solid #F1F5F9"
  },
  taskActions: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap"
  },
  actionButton: {
    display: "flex",
    alignItems: "center",
    gap: 9,
    padding: "13px 22px",
    borderRadius: 11,
    border: "none",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    fontFamily: "'Poppins', sans-serif"
  },
  acknowledgeButton: {
    backgroundColor: "#DBEAFE",
    color: "#1D4ED8"
  },
  completeButton: {
    background: "linear-gradient(135deg, #22C55E 0%, #16A34A 100%)",
    color: "#FFFFFF",
    boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)',
  },
  actionButtonDisabled: {
    opacity: 0.6,
    cursor: "not-allowed"
  },
  completedIndicator: {
    display: "flex",
    alignItems: "center",
    gap: 9,
    padding: "11px 18px",
    backgroundColor: "#F0FDF4",
    borderRadius: 11,
    color: "#22C55E",
    fontSize: 14,
    fontWeight: 600
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "100px 20px",
    textAlign: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    border: "1px solid #E5E7EB"
  },
  emptyIcon: {
    marginBottom: 24,
    opacity: 0.35
  },
  emptyTitle: {
    fontSize: 19,
    fontWeight: 700,
    color: "#475569",
    margin: "0 0 10px 0"
  },
  emptySubtext: {
    fontSize: 15,
    color: "#94A3B8",
    margin: 0,
    fontWeight: 500
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    fontFamily: "'Poppins', sans-serif",
    backgroundColor: "#FEFCF9"
  },
  loadingText: {
    marginTop: 24,
    fontSize: 15,
    color: "#64748B",
    fontWeight: 600
  }
};

const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');
  
  @keyframes hero-fade-in {
    from { opacity: 0; transform: translateY(40px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes metrics-fade-in {
    from { opacity: 0; transform: translateY(30px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes section-fade-in {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes pulse-glow {
    0%, 100% { 
      opacity: 1; 
      transform: scale(1);
      box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.2);
    }
    50% { 
      opacity: 0.7; 
      transform: scale(0.95);
      box-shadow: 0 0 0 6px rgba(34, 197, 94, 0.1);
    }
  }
  
  .hero-fade-in {
    animation: hero-fade-in 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .metrics-fade-in {
    animation: metrics-fade-in 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.2s backwards;
  }
  
  .section-fade-in {
    animation: section-fade-in 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.3s backwards;
  }
  
  .loading-spinner {
    width: 56px;
    height: 56px;
    border: 5px solid #E2E8F0;
    border-top-color: #38BDF8;
    border-radius: 50%;
    animation: spin 0.9s cubic-bezier(0.5, 0, 0.5, 1) infinite;
  }
  
  .button-spinner {
    width: 14px;
    height: 14px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: currentColor;
    borderRadius: 50%;
    animation: spin 0.6s linear infinite;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  .metric-card .metric-glow-active {
    opacity: 1;
  }
  
  .task-card:hover {
    box-shadow: 0 12px 32px rgba(0,0,0,0.1);
    transform: translateY(-6px);
  }
  
  .action-button:hover:not(:disabled) {
    transform: translateY(-3px) scale(1.02);
    box-shadow: 0 8px 20px rgba(0,0,0,0.15);
  }
  
  .complete-btn:hover:not(:disabled) {
    box-shadow: 0 8px 24px rgba(34, 197, 94, 0.4);
  }
  
  .action-button:active:not(:disabled) {
    transform: translateY(-1px) scale(1);
  }
  
  .filter-btn:hover {
    transform: translateY(-2px);
    border-color: #38BDF8;
    color: #38BDF8;
  }
  
  * {
    box-sizing: border-box;
  }
`;

if (typeof document !== 'undefined' && !document.getElementById('employee-dashboard-styles')) {
  styleSheet.id = 'employee-dashboard-styles';
  document.head.appendChild(styleSheet);
}

export default EmployeeDashboard;