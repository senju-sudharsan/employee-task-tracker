import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getTasksByOrganization,
  getEmployeesByOrganization
} from "../services/taskService";

function AdminDashboard({ organizationId, currentUser }) {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!organizationId) return;

    const load = async () => {
      setLoading(true);

      const [taskData, empData] = await Promise.all([
        getTasksByOrganization(organizationId),
        getEmployeesByOrganization(organizationId)
      ]);

      setTasks(taskData || []);
      setEmployees(empData || []);
      setLoading(false);
    };

    load();
  }, [organizationId]);

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div className="loading-spinner"></div>
        <p style={styles.loadingText}>Loading dashboard...</p>
      </div>
    );
  }

  const now = new Date();
  const overdue = tasks.filter(t => {
    if (!t.deadline || t.status === "Done") return false;
    const d =
      typeof t.deadline.toDate === "function"
        ? t.deadline.toDate()
        : new Date(t.deadline);
    return d < now;
  }).length;

  const completedLate = tasks.filter(t => t.status === "Done" && t.completedLate === true).length;
  const completedOnTime = tasks.filter(t => t.status === "Done" && !t.completedLate).length;

  const metrics = {
    total: tasks.length,
    inProgress: tasks.filter(t => t.status !== "Done").length,
    completed: completedOnTime,
    completedLate,
    overdue: overdue
  };

  const completedByMonth = tasks
    .filter(t => t.completedAt)
    .reduce((acc, t) => {
      const date =
        typeof t.completedAt.toDate === "function"
          ? t.completedAt.toDate()
          : new Date(t.completedAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

  const monthlyData = Object.entries(completedByMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6);

  const maxMonthlyCount = monthlyData.length > 0 ? Math.max(...monthlyData.map(([, count]) => count)) : 1;

  const workloadData = employees.map(e => {
    const count = tasks.filter(t => t.assignedTo === e.uid).length;
    return { name: e.name || e.email, count };
  }).sort((a, b) => b.count - a.count);

  const maxWorkload = workloadData.length > 0 ? Math.max(...workloadData.map(w => w.count)) : 1;

  const kpiCards = [
    { 
      label: "Total Tasks", 
      value: metrics.total, 
      color: "#38BDF8",
      bgGradient: "linear-gradient(135deg, rgba(56, 189, 248, 0.08), rgba(56, 189, 248, 0.02))",
      filter: "all",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M9 11l3 3L22 4" />
          <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
        </svg>
      )
    },
    { 
      label: "In Progress", 
      value: metrics.inProgress, 
      color: "#FACC15",
      bgGradient: "linear-gradient(135deg, rgba(250, 204, 21, 0.08), rgba(250, 204, 21, 0.02))",
      filter: "pending",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
      )
    },
    { 
      label: "Completed", 
      value: metrics.completed, 
      color: "#22C55E",
      bgGradient: "linear-gradient(135deg, rgba(34, 197, 94, 0.08), rgba(34, 197, 94, 0.02))",
      filter: "completed",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
          <path d="M22 4L12 14.01l-3-3" />
        </svg>
      )
    },
    { 
      label: "Completed Late", 
      value: metrics.completedLate, 
      color: "#F59E0B",
      bgGradient: "linear-gradient(135deg, rgba(245, 158, 11, 0.08), rgba(245, 158, 11, 0.02))",
      filter: "completed-late",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
          <path d="M16 16l-4-4" />
        </svg>
      )
    },
    { 
      label: "Overdue", 
      value: metrics.overdue, 
      color: "#EF4444",
      bgGradient: "linear-gradient(135deg, rgba(239, 68, 68, 0.08), rgba(239, 68, 68, 0.02))",
      filter: "overdue",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      )
    }
  ];

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatMonth = (monthStr) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(year, parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'short' });
  };

  const getDonutSegments = () => {
    const segments = [];
    let currentOffset = 0;
    const circumference = 2 * Math.PI * 70;
    const total = metrics.total;

    if (total === 0) return segments;

    const data = [
      { value: metrics.completed, color: "#22C55E", key: "completed" },
      { value: metrics.completedLate, color: "#F59E0B", key: "completedLate" },
      { value: metrics.inProgress, color: "#FACC15", key: "progress" },
      { value: metrics.overdue, color: "#EF4444", key: "overdue" }
    ];

    data.forEach(({ value, color, key }) => {
      if (value > 0) {
        const percentage = value / total;
        const strokeLength = circumference * percentage;
        segments.push(
          <circle
            key={key}
            cx="100"
            cy="100"
            r="70"
            fill="none"
            stroke={color}
            strokeWidth="24"
            strokeDasharray={`${strokeLength} ${circumference}`}
            strokeDashoffset={-currentOffset}
            strokeLinecap="round"
            style={{ transition: 'all 0.8s ease' }}
          />
        );
        currentOffset += strokeLength;
      }
    });

    return segments;
  };

  const displayName = currentUser?.name || currentUser?.email || "Admin";

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.welcomeBadge}>
            <div style={styles.welcomeDot} />
            <span>ADMIN ACCESS</span>
          </div>
          <h1 style={styles.title}>Welcome, {displayName}</h1>
          <p style={styles.subtitle}>Operational analytics and team performance overview</p>
        </div>
        <div style={styles.headerRight}>
          <div style={styles.liveIndicator}>
            <div style={styles.liveDot} />
            <span style={styles.liveText}>Live Data</span>
          </div>
        </div>
      </div>

      <div style={styles.kpiGrid}>
        {kpiCards.map((card, idx) => (
          <KpiCard
            key={idx}
            label={card.label}
            value={card.value}
            color={card.color}
            bgGradient={card.bgGradient}
            icon={card.icon}
            onClick={() => navigate(`/tasks?filter=${card.filter}`)}
          />
        ))}
      </div>

      <div style={styles.chartsGrid}>
        <div style={styles.chartCard}>
          <div style={styles.cardHeader}>
            <h3 style={styles.chartTitle}>Task Status Distribution</h3>
            <div style={styles.totalBadge}>{tasks.length} Total</div>
          </div>
          {tasks.length === 0 ? (
            <div style={styles.emptyState}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" style={styles.emptyIcon}>
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <p style={styles.emptyTitle}>No tasks available</p>
              <p style={styles.emptySubtext}>Create your first task to get started</p>
            </div>
          ) : (
            <div style={styles.distributionWrapper}>
              <div style={styles.donutContainer}>
                <svg viewBox="0 0 200 200" width="240" height="240">
                  <circle
                    cx="100"
                    cy="100"
                    r="70"
                    fill="none"
                    stroke="#F1F5F9"
                    strokeWidth="24"
                  />
                  {getDonutSegments()}
                  <text
                    x="100"
                    y="95"
                    textAnchor="middle"
                    fontSize="42"
                    fontWeight="700"
                    fill="#0F172A"
                    fontFamily="Poppins"
                  >
                    {metrics.total}
                  </text>
                  <text
                    x="100"
                    y="115"
                    textAnchor="middle"
                    fontSize="14"
                    fontWeight="500"
                    fill="#64748B"
                    fontFamily="Poppins"
                  >
                    Tasks
                  </text>
                </svg>
              </div>
              <div style={styles.legendGrid}>
                <div style={styles.legendItem}>
                  <div style={{...styles.legendDot, backgroundColor: "#22C55E"}}></div>
                  <div style={styles.legendContent}>
                    <span style={styles.legendLabel}>Completed</span>
                    <span style={styles.legendValue}>{metrics.completed}</span>
                  </div>
                </div>
                <div style={styles.legendItem}>
                  <div style={{...styles.legendDot, backgroundColor: "#F59E0B"}}></div>
                  <div style={styles.legendContent}>
                    <span style={styles.legendLabel}>Completed Late</span>
                    <span style={styles.legendValue}>{metrics.completedLate}</span>
                  </div>
                </div>
                <div style={styles.legendItem}>
                  <div style={{...styles.legendDot, backgroundColor: "#FACC15"}}></div>
                  <div style={styles.legendContent}>
                    <span style={styles.legendLabel}>In Progress</span>
                    <span style={styles.legendValue}>{metrics.inProgress}</span>
                  </div>
                </div>
                <div style={styles.legendItem}>
                  <div style={{...styles.legendDot, backgroundColor: "#EF4444"}}></div>
                  <div style={styles.legendContent}>
                    <span style={styles.legendLabel}>Overdue</span>
                    <span style={styles.legendValue}>{metrics.overdue}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={styles.chartCard}>
          <div style={styles.cardHeader}>
            <h3 style={styles.chartTitle}>Team Workload</h3>
            <div style={styles.totalBadge}>{employees.length} Members</div>
          </div>
          {employees.length === 0 ? (
            <div style={styles.emptyState}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" style={styles.emptyIcon}>
                <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <p style={styles.emptyTitle}>No employees found</p>
              <p style={styles.emptySubtext}>Add team members to track workload</p>
            </div>
          ) : workloadData.every(w => w.count === 0) ? (
            <div style={styles.emptyState}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" style={styles.emptyIcon}>
                <path d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <p style={styles.emptyTitle}>No tasks assigned yet</p>
              <p style={styles.emptySubtext}>Assign tasks to team members</p>
            </div>
          ) : (
            <div style={styles.workloadWrapper}>
              {workloadData.slice(0, 6).map((item, idx) => (
                <div key={idx} style={styles.workloadItem} className="workload-item">
                  <div style={styles.employeeInfo}>
                    <div style={styles.avatarCircle}>
                      {getInitials(item.name)}
                    </div>
                    <div style={styles.employeeDetails}>
                      <div style={styles.employeeName}>{item.name}</div>
                      <div style={styles.taskCount}>{item.count} {item.count === 1 ? 'task' : 'tasks'}</div>
                    </div>
                  </div>
                  <div style={styles.barContainer}>
                    <div style={styles.barBackground}>
                      <div
                        style={{
                          ...styles.barFill,
                          width: `${(item.count / maxWorkload) * 100}%`
                        }}
                      ></div>
                    </div>
                    <span style={styles.countBadge}>{item.count}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={styles.chartCard}>
          <div style={styles.cardHeader}>
            <h3 style={styles.chartTitle}>Productivity Trends</h3>
            <div style={styles.totalBadge}>6 Months</div>
          </div>
          {monthlyData.length === 0 ? (
            <div style={styles.emptyState}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" style={styles.emptyIcon}>
                <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <p style={styles.emptyTitle}>No completed tasks yet</p>
              <p style={styles.emptySubtext}>Complete tasks to see productivity trends</p>
            </div>
          ) : (
            <div style={styles.chartWrapper}>
              <div style={styles.chartContent}>
                {monthlyData.map(([month, count], idx) => (
                  <div key={idx} style={styles.barColumn} className="bar-column">
                    <div style={styles.barWrapper}>
                      <div
                        style={{
                          ...styles.productivityBar,
                          height: `${(count / maxMonthlyCount) * 100}%`
                        }}
                      >
                        <div style={styles.barShine}></div>
                      </div>
                    </div>
                    <div style={styles.monthLabel}>{formatMonth(month)}</div>
                    <div style={styles.monthCount}>{count}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, color, bgGradient, icon, onClick }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        ...styles.kpiCard,
        background: isHovered ? bgGradient : '#FFFFFF',
        transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: isHovered 
          ? `0 12px 32px rgba(0, 0, 0, 0.08), 0 0 0 2px ${color}20`
          : '0 1px 3px rgba(0, 0, 0, 0.06)',
      }}
    >
      <div style={{...styles.kpiIconCircle, background: `${color}15`, color}}>
        {icon}
      </div>
      
      <div style={styles.kpiContent}>
        <p style={styles.kpiLabel}>{label}</p>
        <p style={{...styles.kpiValue, color: isHovered ? color : '#000000'}}>{value}</p>
      </div>

      <div style={{
        ...styles.kpiArrow,
        color,
        opacity: isHovered ? 1 : 0,
        transform: isHovered ? 'translateX(0)' : 'translateX(-10px)',
      }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
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
    gap: 32,
    maxWidth: 1440,
    animation: 'fadeIn 0.5s ease-out',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '40px 48px',
    background: '#FFFFFF',
    borderRadius: 16,
    border: '1px solid #E5E5E5',
  },
  headerLeft: {
    flex: 1,
  },
  welcomeBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 16px',
    background: '#E0F2FE',
    borderRadius: 100,
    marginBottom: 20,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '1px',
    textTransform: 'uppercase',
    color: '#0369A1',
  },
  welcomeDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: '#0369A1',
  },
  title: {
    fontSize: 42,
    fontWeight: 700,
    color: '#000000',
    margin: 0,
    marginBottom: 8,
    letterSpacing: '-0.5px',
  },
  subtitle: {
    fontSize: 15,
    color: '#666666',
    margin: 0,
    fontWeight: 400,
    lineHeight: 1.6,
  },
  headerRight: {
    paddingTop: 8,
  },
  liveIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 16px',
    background: '#F0FDF4',
    borderRadius: 100,
    border: '1px solid #22C55E20',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: '#22C55E',
    animation: 'pulse 2s ease-in-out infinite',
  },
  liveText: {
    fontSize: 13,
    fontWeight: 600,
    color: '#22C55E',
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: 20,
  },
  kpiCard: {
    position: 'relative',
    padding: 28,
    background: '#FFFFFF',
    borderRadius: 12,
    border: '1px solid #E5E5E5',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    overflow: 'hidden',
  },
  kpiIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    transition: 'all 0.3s ease',
  },
  kpiContent: {
    position: 'relative',
    zIndex: 1,
  },
  kpiLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: '#666666',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    margin: 0,
    marginBottom: 8,
  },
  kpiValue: {
    fontSize: 36,
    fontWeight: 700,
    color: '#000000',
    margin: 0,
    letterSpacing: '-1px',
    transition: 'color 0.3s ease',
  },
  kpiArrow: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    transition: 'all 0.3s ease',
  },
  chartsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: 24
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    padding: 28,
    borderRadius: 12,
    border: '1px solid #E5E5E5',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    transition: 'all 0.3s ease',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 600,
    color: '#0F172A',
    margin: 0,
    letterSpacing: '-0.2px'
  },
  totalBadge: {
    fontSize: 13,
    fontWeight: 500,
    color: '#64748B',
    padding: '6px 14px',
    backgroundColor: '#F8FAFC',
    borderRadius: 8
  },
  distributionWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 36,
    padding: '20px 0'
  },
  donutContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  legendGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 16,
    width: '100%',
    maxWidth: 500
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    transition: 'all 0.2s ease',
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: '50%',
    flexShrink: 0
  },
  legendContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2
  },
  legendLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: 500
  },
  legendValue: {
    fontSize: 20,
    fontWeight: 700,
    color: '#0F172A',
    letterSpacing: '-0.3px'
  },
  workloadWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14
  },
  workloadItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    padding: 16,
    borderRadius: 10,
    backgroundColor: '#FAFAFA',
    transition: 'all 0.2s ease'
  },
  employeeInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: 12
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #38BDF8 0%, #0891B2 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 14,
    fontWeight: 600,
    color: '#FFFFFF',
    flexShrink: 0,
    boxShadow: '0 2px 6px rgba(56, 189, 248, 0.25)'
  },
  employeeDetails: {
    flex: 1,
    minWidth: 0
  },
  employeeName: {
    fontSize: 14,
    fontWeight: 600,
    color: '#0F172A',
    marginBottom: 2,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  taskCount: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: 500
  },
  barContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: 12
  },
  barBackground: {
    flex: 1,
    height: 10,
    backgroundColor: '#E2E8F0',
    borderRadius: 5,
    overflow: 'hidden'
  },
  barFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #38BDF8 0%, #0891B2 100%)',
    borderRadius: 5,
    transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
  },
  countBadge: {
    fontSize: 14,
    fontWeight: 700,
    color: '#0F172A',
    minWidth: 28,
    textAlign: 'right'
  },
  chartWrapper: {
    height: 260,
    paddingTop: 10
  },
  chartContent: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: '100%',
    gap: 12,
    paddingBottom: 10
  },
  barColumn: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    height: '100%',
    maxWidth: 70
  },
  barWrapper: {
    flex: 1,
    width: '100%',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center'
  },
  productivityBar: {
    width: '65%',
    background: 'linear-gradient(180deg, #38BDF8 0%, #0891B2 100%)',
    borderRadius: '8px 8px 4px 4px',
    transition: 'height 1s cubic-bezier(0.4, 0, 0.2, 1)',
    minHeight: 10,
    position: 'relative',
    boxShadow: '0 2px 8px rgba(56, 189, 248, 0.25)'
  },
  barShine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '30%',
    background: 'linear-gradient(180deg, rgba(255,255,255,0.4) 0%, transparent 100%)',
    borderRadius: '8px 8px 0 0'
  },
  monthLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 10,
    fontWeight: 500
  },
  monthCount: {
    fontSize: 13,
    fontWeight: 700,
    color: '#0F172A',
    marginTop: 4
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    textAlign: 'center'
  },
  emptyIcon: {
    marginBottom: 16,
    opacity: 0.4
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: 600,
    color: '#475569',
    margin: '0 0 6px 0'
  },
  emptySubtext: {
    fontSize: 13,
    color: '#94A3B8',
    margin: 0,
    fontWeight: 400
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    fontFamily: "'Poppins', sans-serif",
    backgroundColor: '#FEFCF9'
  },
  loadingText: {
    marginTop: 20,
    fontSize: 14,
    color: '#64748B',
    fontWeight: 500
  }
};

const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.6; transform: scale(0.9); }
  }
  
  .loading-spinner {
    width: 48px;
    height: 48px;
    border: 4px solid #E2E8F0;
    border-top-color: #38BDF8;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  .workload-item:hover {
    background-color: #F1F5F9;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.06);
  }
  
  .bar-column:hover .productivityBar {
    opacity: 0.85;
  }
  
  .chartCard:hover {
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  }
  
  .legendItem:hover {
    background-color: #EFF6FF;
    transform: scale(1.02);
  }
  
  * {
    box-sizing: border-box;
  }
`;

if (typeof document !== 'undefined' && !document.getElementById('admin-dashboard-styles')) {
  styleSheet.id = 'admin-dashboard-styles';
  document.head.appendChild(styleSheet);
}

export default AdminDashboard;