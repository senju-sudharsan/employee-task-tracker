function UsersPage() {
  // UI-only placeholder data
  const users = [
    {
      id: "u1",
      name: "Akhil Kumar",
      email: "akhil@org1.com",
      role: "Admin",
      organization: "Organization 1",
      status: "Active"
    },
    {
      id: "u2",
      name: "Neha Sharma",
      email: "neha@org1.com",
      role: "Employee",
      organization: "Organization 1",
      status: "Active"
    },
    {
      id: "u3",
      name: "Rohit Verma",
      email: "rohit@org2.com",
      role: "Employee",
      organization: "Organization 2",
      status: "Disabled"
    }
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
      {/* HEADER */}
      <div>
        <h1 style={styles.pageTitle}>Users</h1>
        <p style={styles.pageSubtitle}>
          Admins and employees across all organizations
        </p>
      </div>

      {/* USER TABLE */}
      <div style={styles.card}>
        <div style={styles.tableHeader}>
          <span>Name</span>
          <span>Role</span>
          <span>Organization</span>
          <span>Status</span>
          <span></span>
        </div>

        {users.map((user) => (
          <div key={user.id} style={styles.tableRow}>
            <div>
              <p style={styles.userName}>{user.name}</p>
              <p style={styles.userEmail}>{user.email}</p>
            </div>

            <span style={styles.role}>{user.role}</span>
            <span style={styles.org}>{user.organization}</span>

            <StatusPill status={user.status} />

            <button style={styles.actionBtn} disabled>
              View
            </button>
          </div>
        ))}
      </div>

      {/* CREATE USER (PLACEHOLDER) */}
      <div style={styles.createCard}>
        <h3 style={styles.cardTitle}>Create User</h3>
        <p style={styles.cardHint}>
          User creation will be enabled in a later phase.
        </p>

        <div style={styles.createGrid}>
          <input placeholder="Email address" disabled style={styles.input} />
          <select disabled style={styles.input}>
            <option>Role</option>
            <option>Admin</option>
            <option>Employee</option>
          </select>
          <select disabled style={styles.input}>
            <option>Organization</option>
          </select>
          <button disabled style={styles.primaryBtnDisabled}>
            Create
          </button>
        </div>
      </div>
    </div>
  );
}

/* ===========================
   SMALL UI PARTS
=========================== */

function StatusPill({ status }) {
  const map = {
    Active: { bg: "#DCFCE7", color: "#166534" },
    Disabled: { bg: "#FEE2E2", color: "#991B1B" }
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
   STYLES (Claude-aligned)
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
  card: {
    backgroundColor: "#FFFFFF",
    border: "1px solid #E2E8F0",
    borderRadius: "16px",
    padding: "24px"
  },
  tableHeader: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr 1fr 1fr 80px",
    fontSize: "13px",
    color: "#64748B",
    fontWeight: 600,
    marginBottom: "12px"
  },
  tableRow: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr 1fr 1fr 80px",
    alignItems: "center",
    padding: "14px 0",
    borderTop: "1px solid #E2E8F0"
  },
  userName: {
    fontSize: "14px",
    fontWeight: 600,
    color: "#1E293B"
  },
  userEmail: {
    fontSize: "13px",
    color: "#64748B"
  },
  role: {
    fontSize: "14px",
    fontWeight: 500
  },
  org: {
    fontSize: "14px",
    color: "#475569"
  },
  actionBtn: {
    padding: "8px 12px",
    borderRadius: "8px",
    border: "1px solid #E2E8F0",
    backgroundColor: "#F8FAFC",
    fontWeight: 600,
    cursor: "not-allowed",
    color: "#94A3B8"
  },
  createCard: {
    backgroundColor: "#FFFFFF",
    border: "1px dashed #CBD5E1",
    borderRadius: "16px",
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
    gridTemplateColumns: "2fr 1fr 1fr 1fr",
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

export default UsersPage;
