/**
 * Super Admin Dashboard
 * Claude-style, calm, consistent
 * No charts yet – clean placeholders only
 */

function SuperAdminDashboard({ tasks = [] }) {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === "Done").length;
  const pendingTasks = tasks.filter(t => t.status === "To Do").length;
  const delayedTasks = tasks.filter(t => t.delayed).length;

  return (
    <div style={styles.container}>
      {/* HEADER */}
      <div style={styles.header}>
        <h1 style={styles.pageTitle}>System Overview</h1>
        <p style={styles.pageSubtitle}>
          High-level insights across all organizations
        </p>
      </div>

      {/* KPI CARDS */}
      <div style={styles.kpiGrid}>
        <KpiCard
          label="Total Tasks"
          value={totalTasks}
          accent="#0EA5A4"
        />
        <KpiCard
          label="Pending Tasks"
          value={pendingTasks}
          accent="#EAB308"
        />
        <KpiCard
          label="Completed Tasks"
          value={completedTasks}
          accent="#22C55E"
        />
        <KpiCard
          label="Delayed Tasks"
          value={delayedTasks}
          accent="#EF4444"
        />
      </div>

      {/* SYSTEM INSIGHTS */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>System Insights</h3>
        <p style={styles.sectionHint}>
          System-level trends and performance visualizations will appear here.
        </p>

        <div style={styles.insightsPlaceholder}>
          <div style={styles.ghostRow}>
            <div style={styles.ghostBlock} />
            <div style={styles.ghostBlock} />
          </div>

          <div style={styles.ghostRow}>
            <div style={{ ...styles.ghostBlock, width: "60%" }} />
            <div style={{ ...styles.ghostBlock, width: "35%" }} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===========================
   KPI CARD
=========================== */
function KpiCard({ label, value, accent }) {
  return (
    <div style={styles.kpiCard}>
      <p style={styles.kpiLabel}>{label}</p>
      <h2 style={styles.kpiValue}>{value}</h2>
      <div style={{ ...styles.kpiAccent, backgroundColor: accent }} />
    </div>
  );
}

/* ===========================
   STYLES (CLAUDE-ALIGNED)
=========================== */
const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "48px"
  },

  header: {
    display: "flex",
    flexDirection: "column",
    gap: "6px"
  },

  pageTitle: {
    fontSize: "28px",
    fontWeight: 700,
    color: "#1E293B"
  },

  pageSubtitle: {
    fontSize: "15px",
    color: "#64748B"
  },

  kpiGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "24px"
  },

  kpiCard: {
    backgroundColor: "#FFFFFF",
    border: "1px solid #E2E8F0",
    borderRadius: "16px",
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    minHeight: "140px"
  },

  kpiLabel: {
    fontSize: "14px",
    color: "#64748B"
  },

  kpiValue: {
    fontSize: "32px",
    fontWeight: 700,
    color: "#0F172A"
  },

  kpiAccent: {
    width: "36px",
    height: "3px",
    borderRadius: "999px",
    marginTop: "12px"
  },

  section: {
    backgroundColor: "#FFFFFF",
    border: "1px solid #E2E8F0",
    borderRadius: "16px",
    padding: "28px",
    display: "flex",
    flexDirection: "column",
    gap: "12px"
  },

  sectionTitle: {
    fontSize: "18px",
    fontWeight: 600,
    color: "#1E293B"
  },

  sectionHint: {
    fontSize: "14px",
    color: "#64748B"
  },

  insightsPlaceholder: {
    marginTop: "12px",
    backgroundColor: "#F8FAFC",
    borderRadius: "14px",
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    gap: "18px"
  },

  ghostRow: {
    display: "flex",
    gap: "16px"
  },

  ghostBlock: {
    height: "64px",
    width: "50%",
    backgroundColor: "#E5E7EB",
    borderRadius: "10px"
  }
};

export default SuperAdminDashboard;
