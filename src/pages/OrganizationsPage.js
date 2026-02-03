import { useEffect, useState } from "react";

/**
 * Organizations Page (Super Admin)
 * - View all organizations
 * - High-level metrics
 * - Create organization placeholder
 * - Claude-style UI
 */
function OrganizationsPage() {
  // Temporary UI-safe data (can be replaced with Firestore later)
  const [organizations, setOrganizations] = useState([]);

  useEffect(() => {
    // Placeholder fetch simulation
    setOrganizations([
      {
        id: "org_1",
        name: "Organization 1",
        admins: 2,
        employees: 12,
        tasks: 48
      },
      {
        id: "org_2",
        name: "Organization 2",
        admins: 1,
        employees: 7,
        tasks: 19
      }
    ]);
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
      {/* HEADER */}
      <div>
        <h1 style={styles.pageTitle}>Organizations</h1>
        <p style={styles.pageSubtitle}>
          View and manage organizations across the platform
        </p>
      </div>

      {/* ORGANIZATION CARDS */}
      {organizations.length === 0 ? (
        <p style={styles.muted}>No organizations found.</p>
      ) : (
        <div style={styles.grid}>
          {organizations.map((org) => (
            <div key={org.id} style={styles.card}>
              <div>
                <h3 style={styles.orgName}>{org.name}</h3>
                <p style={styles.orgId}>ID: {org.id}</p>
              </div>

              <div style={styles.metrics}>
                <Metric label="Admins" value={org.admins} />
                <Metric label="Employees" value={org.employees} />
                <Metric label="Tasks" value={org.tasks} />
              </div>

              <button style={styles.secondaryBtn} disabled>
                View Organization
              </button>
            </div>
          ))}
        </div>
      )}

      {/* CREATE ORGANIZATION */}
      <div style={styles.createCard}>
        <h3 style={styles.cardTitle}>Create Organization</h3>
        <p style={styles.cardHint}>
          Organization creation will be enabled in the next phase.
        </p>

        <div style={styles.createRow}>
          <input
            placeholder="Organization name"
            disabled
            style={styles.input}
          />
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

function Metric({ label, value }) {
  return (
    <div style={styles.metric}>
      <p style={styles.metricLabel}>{label}</p>
      <p style={styles.metricValue}>{value}</p>
    </div>
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
  muted: {
    fontSize: "14px",
    color: "#64748B"
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "24px"
  },
  card: {
    backgroundColor: "#FFFFFF",
    border: "1px solid #E2E8F0",
    borderRadius: "16px",
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    gap: "20px"
  },
  orgName: {
    fontSize: "18px",
    fontWeight: 600,
    color: "#0F172A"
  },
  orgId: {
    fontSize: "13px",
    color: "#64748B"
  },
  metrics: {
    display: "flex",
    gap: "24px"
  },
  metric: {
    display: "flex",
    flexDirection: "column",
    gap: "2px"
  },
  metricLabel: {
    fontSize: "13px",
    color: "#64748B"
  },
  metricValue: {
    fontSize: "22px",
    fontWeight: 700,
    color: "#1E293B"
  },
  secondaryBtn: {
    padding: "10px 14px",
    borderRadius: "10px",
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
  createRow: {
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

export default OrganizationsPage;
