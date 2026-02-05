import { useNavigate } from "react-router-dom";

/* ===========================
   ADMIN DASHBOARD
   Analytics & overview ONLY
=========================== */

function AdminDashboard({ organizationId }) {
  const navigate = useNavigate();

  // TEMP: derived values (logic wiring later)
  const metrics = {
    total: 12,
    pending: 4,
    completed: 6,
    delayed: 2
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
      {/* HEADER */}
      <div>
        <h1 style={styles.pageTitle}>Admin Dashboard</h1>
        <p style={styles.pageSubtitle}>
          High-level overview of workload and team performance
        </p>
      </div>

      {/* METRICS */}
      <div style={styles.metricsGrid}>
        <MetricCard
          title="Total Tasks"
          value={metrics.total}
          bg="#ECFEFF"
          color="#0F766E"
          onClick={() => navigate("/tasks?filter=all")}
        />
        <MetricCard
          title="Pending"
          value={metrics.pending}
          bg="#FFFBEB"
          color="#92400E"
          onClick={() => navigate("/tasks?filter=pending")}
        />
        <MetricCard
          title="Completed"
          value={metrics.completed}
          bg="#ECFDF5"
          color="#166534"
          onClick={() => navigate("/tasks?filter=completed")}
        />
        <MetricCard
          title="Delayed"
          value={metrics.delayed}
          bg="#FEF2F2"
          color="#991B1B"
          onClick={() => navigate("/tasks?filter=overdue")}
        />
      </div>

      {/* TEAM WORKLOAD OVERVIEW */}
      <div style={styles.sectionCard}>
        <h3 style={styles.sectionTitle}>Team Workload</h3>
        <p style={styles.sectionHint}>
          Distribution of active tasks across employees
        </p>

        <div style={styles.placeholder}>
          Employee load visualization will appear here
        </div>
      </div>

      {/* TASK STATUS OVERVIEW */}
      <div style={styles.sectionCard}>
        <h3 style={styles.sectionTitle}>Task Status Overview</h3>
        <p style={styles.sectionHint}>
          Aggregate task distribution for your organization
        </p>

        <div style={styles.placeholder}>
          Status breakdown chart placeholder
        </div>
      </div>

      {/* PRODUCTIVITY TRENDS */}
      <div style={styles.sectionCard}>
        <h3 style={styles.sectionTitle}>Productivity Trends</h3>
        <p style={styles.sectionHint}>
          Weekly and monthly trends will appear here
        </p>

        <div style={styles.placeholder}>
          Trend / velocity chart placeholder
        </div>
      </div>
    </div>
  );
}

/* ===========================
   SMALL COMPONENTS
=========================== */

function MetricCard({ title, value, bg, color, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: bg,
        borderRadius: "20px",
        padding: "28px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        cursor: "pointer"
      }}
    >
      <p style={{ fontSize: "14px", color: "#475569" }}>{title}</p>
      <p style={{ fontSize: "34px", fontWeight: 700, color }}>{value}</p>
    </div>
  );
}

/* ===========================
   STYLES (Claude-style)
=========================== */

const styles = {
  pageTitle: {
    fontSize: "30px",
    fontWeight: 700,
    color: "#1E293B",
    marginBottom: "6px"
  },
  pageSubtitle: {
    fontSize: "15px",
    color: "#64748B"
  },
  metricsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "20px"
  },
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: "20px",
    padding: "28px",
    border: "1px solid #E2E8F0",
    display: "flex",
    flexDirection: "column",
    gap: "12px"
  },
  sectionTitle: {
    fontSize: "18px",
    fontWeight: 600,
    color: "#0F172A"
  },
  sectionHint: {
    fontSize: "14px",
    color: "#64748B"
  },
  placeholder: {
    marginTop: "16px",
    height: "160px",
    borderRadius: "14px",
    border: "1px dashed #CBD5E1",
    backgroundColor: "#F8FAFC",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#94A3B8",
    fontSize: "14px",
    fontWeight: 500
  }
};

export default AdminDashboard;
