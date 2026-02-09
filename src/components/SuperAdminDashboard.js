import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getTasksByOrganization } from "../services/taskService";
import { getAllOrganizations } from "../services/organizationService";

function SuperAdminDashboard({ currentUser }) {
  const navigate = useNavigate();

  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      const orgs = await getAllOrganizations();
      let allTasks = [];

      for (const org of orgs) {
        const tasks = await getTasksByOrganization(org.id);
        allTasks = allTasks.concat(tasks);
      }

      const now = new Date();

      const overdue = allTasks.filter((t) => {
        if (!t.deadline || t.status === "Done") return false;

        const d =
          typeof t.deadline.toDate === "function"
            ? t.deadline.toDate()
            : new Date(t.deadline);

        return d < now;
      }).length;

      const completedLate = allTasks.filter((t) => t.status === "Done" && t.completedLate === true).length;
      const completedOnTime = allTasks.filter((t) => t.status === "Done" && !t.completedLate).length;

      setMetrics({
        total: allTasks.length,
        pending: allTasks.filter((t) => t.status !== "Done").length,
        completed: completedOnTime,
        completedLate,
        overdue
      });

      setLoading(false);
    };

    load();
  }, []);

  if (loading || !metrics) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner} />
        <p style={styles.loadingText}>Loading system overview…</p>
      </div>
    );
  }

  const displayName = currentUser?.name || currentUser?.email || "Admin";
  
  const totalCompleted = metrics.completed + metrics.completedLate;
  const completionRate = metrics.total > 0 ? Math.round((totalCompleted / metrics.total) * 100) : 0;
  const overdueRate = metrics.total > 0 ? Math.round((metrics.overdue / metrics.total) * 100) : 0;
  const activeRate = metrics.total > 0 ? Math.round((metrics.pending / metrics.total) * 100) : 0;

  return (
    <div style={styles.container}>
      <div style={styles.heroSection} className="hero-fade-in">
        <div style={styles.heroGlow}></div>
        <div style={styles.heroContent}>
          <div style={styles.heroLeft}>
            <div style={styles.statusBadge}>
              <div style={styles.statusDot} />
              <span>SUPER ADMIN</span>
            </div>
            <h1 style={styles.heroTitle}>Welcome, {displayName}</h1>
            <p style={styles.heroSubtitle}>
              Enterprise-wide task monitoring and system overview
            </p>
          </div>
          <div style={styles.heroRight}>
            <div style={styles.liveIndicator}>
              <div style={styles.liveDot} />
              <span style={styles.liveText}>Live Data</span>
            </div>
          </div>
        </div>
      </div>

      <div style={styles.kpiGrid} className="metrics-fade-in">
        <KpiCard
          label="Total Tasks"
          value={metrics.total}
          subtitle="All organizations"
          icon={
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
            </svg>
          }
          color="#38BDF8"
          gradient="linear-gradient(135deg, #38BDF8 0%, #0891B2 100%)"
          onClick={() => navigate("/tasks?filter=all")}
        />
        <KpiCard
          label="In Progress"
          value={metrics.pending}
          subtitle="Active work items"
          icon={
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
          }
          color="#FACC15"
          gradient="linear-gradient(135deg, #FACC15 0%, #F59E0B 100%)"
          onClick={() => navigate("/tasks?filter=pending")}
        />
        <KpiCard
          label="Completed"
          value={metrics.completed}
          subtitle="On-time closures"
          icon={
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
              <path d="M22 4L12 14.01l-3-3" />
            </svg>
          }
          color="#22C55E"
          gradient="linear-gradient(135deg, #22C55E 0%, #16A34A 100%)"
          onClick={() => navigate("/tasks?filter=completed")}
        />
        <KpiCard
          label="Completed Late"
          value={metrics.completedLate}
          subtitle="Closed past deadline"
          icon={
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
              <path d="M16 16l-4-4" />
            </svg>
          }
          color="#F59E0B"
          gradient="linear-gradient(135deg, #F59E0B 0%, #D97706 100%)"
          onClick={() => navigate("/tasks?filter=completed-late")}
        />
        <KpiCard
          label="Overdue"
          value={metrics.overdue}
          subtitle="Requires attention"
          icon={
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          }
          color="#EF4444"
          gradient="linear-gradient(135deg, #EF4444 0%, #DC2626 100%)"
          onClick={() => navigate("/tasks?filter=overdue")}
        />
      </div>

      <div style={styles.analyticsSection} className="section-fade-in">
        <div style={styles.sectionHeader}>
          <div>
            <h2 style={styles.sectionTitle}>System Health</h2>
            <p style={styles.sectionDescription}>
              Key performance indicators at a glance
            </p>
          </div>
          <button
            onClick={() => navigate("/analytics")}
            style={styles.viewAnalyticsButton}
            className="view-analytics-button"
          >
            <span>View Full Analytics</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <div style={styles.insightsGrid}>
          <div style={styles.insightCard} className="insight-card">
            <div style={styles.insightHeader}>
              <div style={{...styles.insightIcon, background: 'linear-gradient(135deg, #DCFCE7 0%, #BBF7D0 100%)'}}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              </div>
              <h3 style={styles.insightTitle}>Completion Rate</h3>
            </div>
            <p style={styles.insightDescription}>
              Overall task completion across all organizations
            </p>
            
            <div style={styles.progressRingWrapper}>
              <ProgressRing percentage={completionRate} color="#22C55E" size={120} />
              <div style={styles.ringCenter}>
                <div style={{...styles.ringValue, color: '#22C55E'}}>{completionRate}%</div>
                <div style={styles.ringLabel}>Complete</div>
              </div>
            </div>
          </div>

          <div style={styles.insightCard} className="insight-card">
            <div style={styles.insightHeader}>
              <div style={{...styles.insightIcon, background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)'}}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <h3 style={styles.insightTitle}>Active Workload</h3>
            </div>
            <p style={styles.insightDescription}>
              Tasks currently in progress across teams
            </p>
            
            <div style={styles.metricsWrapper}>
              <div style={styles.metricRow}>
                <div style={styles.metricRowHeader}>
                  <span style={styles.metricRowLabel}>In Progress</span>
                  <span style={{...styles.metricRowValue, color: '#FACC15'}}>{metrics.pending}</span>
                </div>
                <div style={styles.progressBar}>
                  <div 
                    className="progress-fill"
                    style={{...styles.progressFill, width: `${activeRate}%`, background: 'linear-gradient(90deg, #FACC15 0%, #F59E0B 100%)'}}
                  />
                </div>
              </div>

              <div style={styles.metricRow}>
                <div style={styles.metricRowHeader}>
                  <span style={styles.metricRowLabel}>Completed</span>
                  <span style={{...styles.metricRowValue, color: '#22C55E'}}>{totalCompleted}</span>
                </div>
                <div style={styles.progressBar}>
                  <div 
                    className="progress-fill"
                    style={{...styles.progressFill, width: `${completionRate}%`, background: 'linear-gradient(90deg, #22C55E 0%, #16A34A 100%)', animationDelay: '0.1s'}}
                  />
                </div>
              </div>
            </div>
          </div>

          <div style={styles.insightCard} className="insight-card">
            <div style={styles.insightHeader}>
              <div style={{...styles.insightIcon, background: 'linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)'}}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <h3 style={styles.insightTitle}>Risk Overview</h3>
            </div>
            <p style={styles.insightDescription}>
              Tasks requiring immediate attention
            </p>
            
            <div style={styles.riskMetrics}>
              <div style={styles.riskMetricItem}>
                <div style={{...styles.riskMetricValue, color: '#EF4444'}}>{metrics.overdue}</div>
                <div style={styles.riskMetricLabel}>Overdue Tasks</div>
                <div style={{...styles.riskPercentage, color: '#EF4444'}}>{overdueRate}% of total</div>
              </div>
              
              <div style={styles.miniGauge}>
                <svg width="100%" height="60" viewBox="0 0 100 60">
                  <path
                    d="M 10 50 A 40 40 0 0 1 90 50"
                    fill="none"
                    stroke="#F1F5F9"
                    strokeWidth="8"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 10 50 A 40 40 0 0 1 90 50"
                    fill="none"
                    stroke="#EF4444"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${(overdueRate / 100) * 126} 126`}
                    style={{transition: 'stroke-dasharray 1s ease'}}
                    className="gauge-fill"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, subtitle, icon, color, gradient, onClick }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        ...styles.kpiCard,
        transform: isHovered ? 'translateY(-8px) scale(1.02)' : 'translateY(0) scale(1)',
        boxShadow: isHovered 
          ? `0 20px 40px rgba(0, 0, 0, 0.12), 0 0 0 3px ${color}20, 0 0 20px ${color}40`
          : '0 2px 8px rgba(0, 0, 0, 0.06)',
      }}
      className="kpi-card"
    >
      <div style={styles.kpiGlow} className={isHovered ? "kpi-glow-active" : ""}></div>
      <div style={{
        ...styles.kpiIconCircle, 
        background: isHovered ? gradient : `${color}12`,
        color: isHovered ? "#FFFFFF" : color,
        transform: isHovered ? "scale(1.1) rotate(5deg)" : "scale(1) rotate(0deg)"
      }}>
        {icon}
      </div>
      
      <div style={styles.kpiContent}>
        <p style={styles.kpiLabel}>{label}</p>
        <p style={{
          ...styles.kpiValue, 
          background: isHovered ? gradient : "transparent",
          WebkitBackgroundClip: isHovered ? "text" : "unset",
          WebkitTextFillColor: isHovered ? "transparent" : color,
          backgroundClip: isHovered ? "text" : "unset"
        }}>
          {value}
        </p>
        <p style={styles.kpiSubtitle}>{subtitle}</p>
      </div>

      <div style={{
        ...styles.kpiArrow,
        color,
        opacity: isHovered ? 1 : 0,
        transform: isHovered ? 'translateX(0)' : 'translateX(-10px)',
      }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  );
}

function ProgressRing({ percentage, color, size = 120 }) {
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <svg width={size} height={size} style={{transform: 'rotate(-90deg)'}}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#F1F5F9"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{transition: 'stroke-dashoffset 1s ease'}}
        className="ring-progress"
      />
    </svg>
  );
}

const styles = {
  container: {
    fontFamily: "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    backgroundColor: "#FEFCF9",
    minHeight: "100vh",
    display: 'flex',
    flexDirection: 'column',
    gap: 64,
    maxWidth: 1440,
    margin: "0 auto",
    padding: "0 32px 80px",
  },

  loadingContainer: {
    fontFamily: "'Poppins', sans-serif",
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    gap: 20,
    backgroundColor: "#FEFCF9",
  },
  loadingSpinner: {
    width: 64,
    height: 64,
    border: '6px solid #E2E8F0',
    borderTop: '6px solid #38BDF8',
    borderRadius: '50%',
    animation: 'spin 1s cubic-bezier(0.5, 0, 0.5, 1) infinite',
  },
  loadingText: {
    fontSize: 15,
    color: '#64748B',
    fontWeight: 600,
  },

  heroSection: {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    padding: "64px 64px",
    background: "linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)",
    borderRadius: 24,
    border: "1px solid rgba(226, 232, 240, 0.8)",
    overflow: "hidden",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.06)",
  },
  heroGlow: {
    position: "absolute",
    top: -100,
    right: -100,
    width: 400,
    height: 400,
    background: "radial-gradient(circle, rgba(56, 189, 248, 0.12) 0%, transparent 70%)",
    borderRadius: "50%",
    pointerEvents: "none",
  },
  heroContent: {
    position: "relative",
    zIndex: 1,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  heroLeft: {
    flex: 1,
  },
  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 22px',
    background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
    borderRadius: 100,
    marginBottom: 28,
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: '1.2px',
    textTransform: 'uppercase',
    color: '#92400E',
    boxShadow: '0 4px 12px rgba(146, 64, 14, 0.2)',
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: '50%',
    background: '#92400E',
    boxShadow: '0 0 8px rgba(146, 64, 14, 0.6)',
  },
  heroTitle: {
    fontSize: 56,
    fontWeight: 800,
    color: "#0F172A",
    margin: 0,
    marginBottom: 16,
    letterSpacing: "-1.5px",
    lineHeight: 1.1,
  },
  heroSubtitle: {
    fontSize: 18,
    color: "#64748B",
    margin: 0,
    fontWeight: 500,
    lineHeight: 1.6,
    maxWidth: 600,
  },
  heroRight: {
    paddingTop: 12,
  },
  liveIndicator: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "12px 22px",
    background: "linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)",
    borderRadius: 100,
    border: "1px solid rgba(34, 197, 94, 0.2)",
    boxShadow: "0 4px 12px rgba(34, 197, 94, 0.15)",
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

  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: 24,
  },

  kpiCard: {
    position: 'relative',
    padding: 36,
    background: '#FFFFFF',
    borderRadius: 20,
    border: '1px solid #E5E7EB',
    cursor: 'pointer',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    overflow: 'hidden',
  },
  kpiGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "radial-gradient(circle at top right, rgba(56, 189, 248, 0.1) 0%, transparent 70%)",
    opacity: 0,
    transition: "opacity 0.4s ease",
    pointerEvents: "none",
  },
  kpiIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    position: "relative",
    zIndex: 1,
  },
  kpiContent: {
    position: 'relative',
    zIndex: 1,
  },
  kpiLabel: {
    fontSize: 12,
    fontWeight: 700,
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: '0.8px',
    margin: 0,
    marginBottom: 10,
  },
  kpiValue: {
    fontSize: 48,
    fontWeight: 800,
    margin: 0,
    marginBottom: 6,
    letterSpacing: '-2px',
    transition: 'all 0.4s ease',
  },
  kpiSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    margin: 0,
    fontWeight: 500,
  },
  kpiArrow: {
    position: 'absolute',
    bottom: 28,
    right: 28,
    transition: 'all 0.3s ease',
  },

  analyticsSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 32,
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 38,
    fontWeight: 800,
    color: "#0F172A",
    margin: 0,
    marginBottom: 10,
    letterSpacing: "-1px",
  },
  sectionDescription: {
    fontSize: 16,
    color: "#64748B",
    margin: 0,
    fontWeight: 500,
  },
  viewAnalyticsButton: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '14px 28px',
    background: 'linear-gradient(135deg, #38BDF8 0%, #0891B2 100%)',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: 14,
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    fontFamily: "'Poppins', sans-serif",
    boxShadow: '0 4px 16px rgba(56, 189, 248, 0.3)',
  },

  insightsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 28,
  },
  insightCard: {
    padding: 36,
    background: '#FFFFFF',
    borderRadius: 20,
    border: '1px solid #E5E7EB',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  insightHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    marginBottom: 18,
  },
  insightIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.06)',
  },
  insightTitle: {
    fontSize: 19,
    fontWeight: 700,
    color: '#0F172A',
    margin: 0,
    letterSpacing: '-0.3px',
  },
  insightDescription: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 1.6,
    margin: 0,
    marginBottom: 32,
    fontWeight: 500,
  },

  progressRingWrapper: {
    position: 'relative',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: 120,
  },
  ringCenter: {
    position: 'absolute',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringValue: {
    fontSize: 26,
    fontWeight: 800,
    letterSpacing: '-1px',
  },
  ringLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: 600,
    marginTop: 2,
  },

  metricsWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
  },
  metricRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  metricRowHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricRowLabel: {
    fontSize: 13,
    fontWeight: 600,
    color: '#64748B',
  },
  metricRowValue: {
    fontSize: 18,
    fontWeight: 800,
    letterSpacing: '-0.5px',
  },
  progressBar: {
    height: 10,
    background: '#F1F5F9',
    borderRadius: 100,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 100,
    transition: 'width 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
  },

  riskMetrics: {
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  riskMetricItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
  },
  riskMetricValue: {
    fontSize: 36,
    fontWeight: 800,
    letterSpacing: '-1.5px',
    lineHeight: 1,
  },
  riskMetricLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: 600,
  },
  riskPercentage: {
    fontSize: 12,
    fontWeight: 700,
    marginTop: 2,
  },
  miniGauge: {
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    marginTop: 8,
  },
};

if (typeof document !== 'undefined') {
  const styleTag = document.createElement('style');
  styleTag.textContent = `
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
    
    @keyframes spin {
      to { transform: rotate(360deg); }
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
    
    .kpi-card .kpi-glow-active {
      opacity: 1;
    }
    
    .view-analytics-button:hover {
      transform: translateY(-3px) scale(1.02);
      box-shadow: 0 8px 24px rgba(56, 189, 248, 0.4);
    }
    
    .view-analytics-button:active {
      transform: translateY(-1px) scale(1);
    }
    
    .insight-card:hover {
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.1);
      transform: translateY(-4px);
    }
    
    .progress-fill {
      animation: progress-grow 1.2s cubic-bezier(0.4, 0, 0.2, 1) backwards;
    }
    
    @keyframes progress-grow {
      from { width: 0; }
    }
    
    .ring-progress {
      animation: ring-draw 1.2s cubic-bezier(0.4, 0, 0.2, 1) backwards;
    }
    
    @keyframes ring-draw {
      from { stroke-dashoffset: 314; }
    }
    
    .gauge-fill {
      animation: gauge-fill 1.2s cubic-bezier(0.4, 0, 0.2, 1) 0.2s backwards;
    }
    
    @keyframes gauge-fill {
      from { stroke-dasharray: 0 126; }
    }
    
    * {
      box-sizing: border-box;
    }
  `;
  document.head.appendChild(styleTag);
}

export default SuperAdminDashboard;