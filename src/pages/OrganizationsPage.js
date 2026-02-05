import { useEffect, useState } from "react";
import {
  getAllOrganizations,
  createOrganization,
  toggleOrganizationStatus
} from "../services/organizationService";
import { auth } from "../firebase";

function OrganizationsPage() {
  const [orgs, setOrgs] = useState([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  const load = async () => {
    setLoading(true);
    const data = await getAllOrganizations();
    setOrgs(data || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async () => {
    if (!name.trim()) return;

    setCreating(true);
    await createOrganization({
      name,
      createdBy: auth.currentUser.uid
    });
    setName("");
    await load();
    setCreating(false);
  };

  const handleToggle = async (org) => {
    setTogglingId(org.id);
    await toggleOrganizationStatus(org.id, org.status);
    await load();
    setTogglingId(null);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
      {/* HEADER */}
      <div>
        <h1 style={styles.pageTitle}>Organizations</h1>
        <p style={styles.pageSubtitle}>
          Manage organizations across the platform
        </p>
      </div>

      {/* LIST */}
      {loading ? (
        <p style={styles.muted}>Loading organizations…</p>
      ) : orgs.length === 0 ? (
        <p style={styles.muted}>No organizations created yet.</p>
      ) : (
        <div style={styles.grid}>
          {orgs.map((org) => (
            <div key={org.id} style={styles.card}>
              <div>
                <h3 style={styles.orgName}>{org.name}</h3>

                <p style={styles.orgMeta}>
                  Status:{" "}
                  <strong
                    style={{
                      color:
                        org.status === "active" ? "#166534" : "#991B1B"
                    }}
                  >
                    {org.status}
                  </strong>
                </p>

                <p style={styles.orgMeta}>
                  Created by: {org.createdBy?.slice(0, 6)}…
                </p>

                <p style={{ fontSize: "12px", color: "#94A3B8" }}>
                  Org ID: {org.id}
                </p>
              </div>

              {/* TOGGLE BUTTON */}
              <button
                onClick={() => handleToggle(org)}
                disabled={togglingId === org.id}
                style={{
                  marginTop: "16px",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  border: "none",
                  fontWeight: 600,
                  cursor: "pointer",
                  backgroundColor:
                    org.status === "active" ? "#FEE2E2" : "#DCFCE7",
                  color:
                    org.status === "active" ? "#991B1B" : "#166534"
                }}
              >
                {togglingId === org.id
                  ? "Updating…"
                  : org.status === "active"
                  ? "Disable Organization"
                  : "Enable Organization"}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* CREATE */}
      <div style={styles.createCard}>
        <h3 style={styles.cardTitle}>Create Organization</h3>
        <p style={styles.cardHint}>
          This will allow admins and employees to be assigned later.
        </p>

        <div style={styles.createRow}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Organization name"
            style={styles.input}
          />
          <button
            onClick={handleCreate}
            disabled={creating}
            style={styles.primaryBtn}
          >
            {creating ? "Creating..." : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ===========================
   STYLES (Claude-aligned)
=========================== */
const styles = {
  pageTitle: { fontSize: "28px", fontWeight: 700 },
  pageSubtitle: { fontSize: "15px", color: "#64748B" },
  muted: { color: "#64748B" },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    gap: "24px"
  },
  card: {
    background: "#FFFFFF",
    border: "1px solid #E2E8F0",
    borderRadius: "16px",
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between"
  },
  orgName: { fontSize: "18px", fontWeight: 600 },
  orgMeta: { fontSize: "14px", color: "#64748B" },

  createCard: {
    background: "#FFFFFF",
    border: "1px dashed #CBD5E1",
    borderRadius: "16px",
    padding: "24px"
  },
  cardTitle: { fontSize: "18px", fontWeight: 600 },
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
    border: "1px solid #E2E8F0"
  },
  primaryBtn: {
    background: "#16A6B0",
    color: "#FFF",
    border: "none",
    borderRadius: "10px",
    fontWeight: 600
  }
};

export default OrganizationsPage;
