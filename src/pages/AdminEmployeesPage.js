function AdminEmployeesPage() {
  // UI-only placeholder data (ORG SCOPED)
  const employees = [
    {
      id: "e1",
      name: "Neha Sharma",
      email: "neha@org.com",
      role: "Employee",
      status: "Active",
      tasks: 5
    },
    {
      id: "e2",
      name: "Rohit Verma",
      email: "rohit@org.com",
      role: "Employee",
      status: "Overloaded",
      tasks: 12
    },
    {
      id: "e3",
      name: "Akhil Kumar",
      email: "akhil@org.com",
      role: "Employee",
      status: "Inactive",
      tasks: 0
    }
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "36px" }}>
      {/* HEADER */}
      <div>
        <h1 style={styles.pageTitle}>Employees</h1>
        <p style={styles.pageSubtitle}>
          Manage employees and monitor workload in your organization
        </p>
      </div>

      {/* EMPLOYEE GRID */}
      <div style={styles.grid}>
        {employees.map((emp) => (
          <div
            key={emp.id}
            style={{
              ...styles.card,
              backgroundColor:
                emp.status === "Active"
                  ? "#ECFEFF"
                  : emp.status === "Overloaded"
                  ? "#FFF7ED"
                  : "#F8FAFC"
            }}
          >
            {/* HEADER */}
            <div style={styles.cardHeader}>
              <div>
                <p style={styles.name}>{emp.name}</p>
                <p style={styles.email}>{emp.email}</p>
              </div>

              <StatusPill status={emp.status} />
            </div>

            {/* METRICS */}
            <div style={styles.metrics}>
              <Metric label="Assigned Tasks" value={emp.tasks} />
              <Metric label="Role" value={emp.role} />
            </div>

            {/* ACTIONS */}
            <div style={styles.actions}>
              <button style={styles.secondaryBtn} disabled>
                View
              </button>
              <button style={styles.dangerBtn} disabled>
                Disable
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* CREATE EMPLOYEE PLACEHOLDER */}
      <div style={styles.createCard}>
        <h3 style={styles.cardTitle}>Add Employee</h3>
        <p style={styles.cardHint}>
          Employee creation will be enabled in a later phase.
        </p>

        <div style={styles.createGrid}>
          <input placeholder="Email address" disabled style={styles.input} />
          <button disabled style={styles.primaryBtnDisabled}>
            Invite
          </button>
        </div>
      </div>
    </div>
  );
}

/* ===========================
   SMALL UI PARTS
=========================== */

function Metric({ label, value }) {
  return (
    <div>
      <p style={styles.metricLabel}>{label}</p>
      <p style={styles.metricValue}>{value}</p>
    </div>
  );
}

function StatusPill({ status }) {
  const map = {
    Active: { bg: "#D1FAE5", color: "#065F46" },
    Overloaded: { bg: "#FFEDD5", color: "#9A3412" },
    Inactive: { bg: "#E5E7EB", color: "#374151" }
  };

  const s = map[status];

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

/* ===========================
   STYLES (CLAUDE-ALIGNED)
=========================== */

const styles = {
  pageTitle: {
    fontSize: "28px",
    fontWeight: 700,
    color: "#1E293B",
    marginBottom: "6px"
  },
  pageSubtitle: {
    fontSize: "15px",
    color: "#64748B"
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
    gap: "24px"
  },
  card: {
    border: "1px solid #E2E8F0",
    borderRadius: "18px",
    padding: "22px",
    display: "flex",
    flexDirection: "column",
    gap: "18px"
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  name: {
    fontSize: "16px",
    fontWeight: 600,
    color: "#0F172A"
  },
  email: {
    fontSize: "13px",
    color: "#64748B"
  },
  metrics: {
    display: "flex",
    gap: "32px"
  },
  metricLabel: {
    fontSize: "13px",
    color: "#64748B"
  },
  metricValue: {
    fontSize: "18px",
    fontWeight: 700,
    color: "#1E293B"
  },
  actions: {
    display: "flex",
    gap: "10px"
  },
  secondaryBtn: {
    padding: "10px 14px",
    borderRadius: "10px",
    border: "1px solid #E2E8F0",
    backgroundColor: "#F8FAFC",
    fontWeight: 600,
    cursor: "not-allowed",
    color: "#64748B"
  },
  dangerBtn: {
    padding: "10px 14px",
    borderRadius: "10px",
    border: "1px solid #FECACA",
    backgroundColor: "#FEE2E2",
    fontWeight: 600,
    cursor: "not-allowed",
    color: "#991B1B"
  },
  createCard: {
    backgroundColor: "#FFFFFF",
    border: "1px dashed #CBD5E1",
    borderRadius: "18px",
    padding: "24px"
  },
  cardTitle: {
    fontSize: "18px",
    fontWeight: 600,
    marginBottom: "6px"
  },
  cardHint: {
    fontSize: "14px",
    color: "#64748B",
    marginBottom: "16px"
  },
  createGrid: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr",
    gap: "12px"
  },
  input: {
    padding: "12px 14px",
    borderRadius: "10px",
    border: "1px solid #E2E8F0",
    fontSize: "14px",
    backgroundColor: "#F8FAFC"
  },
  primaryBtnDisabled: {
    backgroundColor: "#CBD5E1",
    color: "#475569",
    border: "none",
    borderRadius: "10px",
    fontWeight: 600,
    cursor: "not-allowed"
  }
};

export default AdminEmployeesPage;
