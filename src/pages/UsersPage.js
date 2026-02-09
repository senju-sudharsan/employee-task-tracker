import { useEffect, useState } from "react";
import { auth } from "../firebase";
import { getAllUsers, createEmployee } from "../services/userService";
import { getUserProfile } from "../services/authService";
import { ROLES, roleCapabilities } from "../config/roles";
import { getAllOrganizations } from "../services/organizationService";

function UsersPage() {
  const [users, setUsers] = useState([]);
  const [organizations, setOrganizations] = useState([]);

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  const [selectedOrgId, setSelectedOrgId] = useState(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [creating, setCreating] = useState(false);

  const [focusedInput, setFocusedInput] = useState(null);

  /* ===========================
     BOOTSTRAP
  =========================== */
  useEffect(() => {
    const bootstrap = async () => {
      if (!auth.currentUser) return;

      const userProfile = await getUserProfile(auth.currentUser.uid);
      setProfile(userProfile);

      const role = userProfile.role;

      // 🔐 ACCESS GATE (FINAL, CORRECT)
      if (!roleCapabilities[role]?.canManageUsers) {
        alert("Access denied");
        setLoading(false);
        return;
      }

      // 🟣 SUPER ADMIN → select org
      if (role === ROLES.SUPERADMIN) {
        const orgs = await getAllOrganizations();
        setOrganizations(orgs || []);
      }

      // 🔵 ADMIN → forced org
      if (role === ROLES.ADMIN) {
        if (!userProfile.organizationId) {
          alert("Admin has no organization assigned");
          setLoading(false);
          return;
        }
        setSelectedOrgId(userProfile.organizationId);
      }

      const allUsers = await getAllUsers();
      setUsers(allUsers || []);
      setLoading(false);
    };

    bootstrap();
  }, []);

  /* ===========================
     CREATE EMPLOYEE
  =========================== */
  const handleCreate = async () => {
    if (!name || !email || !password || !selectedOrgId) {
      alert("All fields are required");
      return;
    }

    setCreating(true);

    try {
      await createEmployee({
        name,
        email,
        password,
        organizationId: selectedOrgId,
        createdBy: auth.currentUser.uid
      });

      setName("");
      setEmail("");
      setPassword("");

      const updated = await getAllUsers();
      setUsers(updated || []);
    } catch (err) {
      alert(err.message);
    }

    setCreating(false);
  };

  /* ===========================
     FILTER USERS BY ORG
  =========================== */
  const visibleUsers = selectedOrgId
    ? users.filter(u => u.organizationId === selectedOrgId)
    : [];

  /* ===========================
     KPI CALCULATIONS
  =========================== */
  const totalUsers = visibleUsers.length;
  const adminCount = visibleUsers.filter(u => u.role === ROLES.ADMIN).length;
  const employeeCount = visibleUsers.filter(u => u.role === ROLES.EMPLOYEE).length;

  if (loading) {
    return (
      <div style={styles.loadingState}>
        <div className="loading-spinner"></div>
        <p style={styles.loadingText}>Loading workspace…</p>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {/* KPI STRIP */}
      {selectedOrgId && (
        <div style={styles.kpiStrip} className="kpi-fade-in">
          <KpiCard
            label="Total Users"
            value={totalUsers}
            delay="0s"
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            }
          />
          <KpiCard
            label="Admins"
            value={adminCount}
            delay="0.1s"
            accent="#F59E0B"
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
              </svg>
            }
          />
          <KpiCard
            label="Employees"
            value={employeeCount}
            delay="0.2s"
            accent="#D97706"
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            }
          />
        </div>
      )}

      {/* HEADER */}
      <div className="header-fade-in">
        <h1 style={styles.pageTitle}>User Management</h1>
        <p style={styles.pageSubtitle}>
          Manage team members and access controls across your organization
        </p>
      </div>

      {/* SUPER ADMIN ORG SELECT */}
      {profile?.role === ROLES.SUPERADMIN && (
        <div style={styles.orgSelectorCard} className="content-fade-in">
          <div style={styles.orgSelectorGlow}></div>
          <div style={styles.orgSelectorContent}>
            <label style={styles.orgLabel}>Select Organization</label>
            <div style={styles.selectWrapper}>
              <select
                value={selectedOrgId || ""}
                onChange={e => setSelectedOrgId(e.target.value)}
                style={styles.select}
              >
                <option value="">Choose an organization to manage</option>
                {organizations.map(org => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
              <svg style={styles.selectIcon} width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* SUPER ADMIN EMPTY STATE */}
      {profile?.role === ROLES.SUPERADMIN && !selectedOrgId && (
        <div style={styles.emptyState} className="content-fade-in">
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none" style={styles.emptyIcon}>
            <circle cx="40" cy="40" r="30" stroke="#D4A574" strokeWidth="2" opacity="0.3"/>
            <path d="M40 25v20M40 55h.02" stroke="#D4A574" strokeWidth="3" strokeLinecap="round"/>
          </svg>
          <p style={styles.emptyTitle}>Select an Organization</p>
          <p style={styles.emptyText}>Choose an organization from above to view and manage team members</p>
        </div>
      )}

      {/* USERS GRID */}
      {selectedOrgId && visibleUsers.length > 0 && (
        <div className="content-fade-in">
          <h2 style={styles.sectionTitle}>Team Members</h2>
          <div style={styles.grid}>
            {visibleUsers.map((u, idx) => {
              const isAdmin = u.role === ROLES.ADMIN;
              const initial = u.name?.charAt(0)?.toUpperCase() || "U";
              const orgName = organizations.find(org => org.id === u.organizationId)?.name || "Organization";

              return (
                <div
                  key={u.id}
                  style={{
                    ...styles.userCard,
                    animationDelay: `${idx * 0.05}s`
                  }}
                  className="user-card"
                >
                  {/* CARD GLOW */}
                  <div style={styles.cardGlow} className="card-glow-active"></div>

                  {/* USER AVATAR */}
                  <div style={styles.userAvatar}>
                    <div style={styles.avatarInner}>
                      {initial}
                    </div>
                  </div>

                  {/* USER INFO */}
                  <div style={styles.userInfo}>
                    <h3 style={styles.userName}>{u.name}</h3>
                    <p style={styles.userEmail}>{u.email}</p>
                  </div>

                  {/* METADATA */}
                  <div style={styles.userMeta}>
                    <div style={styles.metaRow}>
                      <span style={{
                        ...styles.roleBadge,
                        ...(isAdmin ? styles.roleBadgeAdmin : styles.roleBadgeEmployee)
                      }}>
                        <div
                          style={{
                            ...styles.roleDot,
                            backgroundColor: isAdmin ? "#F59E0B" : "#64748B"
                          }}
                        ></div>
                        {isAdmin ? "Admin" : "Employee"}
                      </span>
                    </div>
                    <p style={styles.orgIndicator}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={styles.orgIcon}>
                        <rect x="3" y="3" width="7" height="7" rx="1" />
                        <rect x="14" y="3" width="7" height="7" rx="1" />
                        <rect x="14" y="14" width="7" height="7" rx="1" />
                        <rect x="3" y="14" width="7" height="7" rx="1" />
                      </svg>
                      {orgName}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* EMPTY STATE FOR NO USERS */}
      {selectedOrgId && visibleUsers.length === 0 && (
        <div style={styles.emptyState} className="content-fade-in">
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none" style={styles.emptyIcon}>
            <circle cx="40" cy="40" r="30" stroke="#D4A574" strokeWidth="2" opacity="0.3"/>
            <path d="M25 40h30M40 25v30" stroke="#D4A574" strokeWidth="3" strokeLinecap="round"/>
          </svg>
          <p style={styles.emptyTitle}>No Team Members Yet</p>
          <p style={styles.emptyText}>Get started by creating your first employee below</p>
        </div>
      )}

      {/* CREATE EMPLOYEE */}
      {selectedOrgId && (
        <div style={styles.createCard} className="create-fade-in">
          <div style={styles.createGlow}></div>

          <div style={styles.createContent}>
            <h3 style={styles.createTitle}>Create New Employee</h3>
            <p style={styles.createHint}>
              Add a new team member to your organization with a temporary password they can change on first login.
            </p>

            <div style={styles.formGrid}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Full Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onFocus={() => setFocusedInput("name")}
                  onBlur={() => setFocusedInput(null)}
                  placeholder="John Doe"
                  style={{
                    ...styles.input,
                    ...(focusedInput === "name" ? styles.inputFocused : {})
                  }}
                  className="form-input"
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Email Address</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedInput("email")}
                  onBlur={() => setFocusedInput(null)}
                  placeholder="john.doe@company.com"
                  style={{
                    ...styles.input,
                    ...(focusedInput === "email" ? styles.inputFocused : {})
                  }}
                  className="form-input"
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Temporary Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedInput("password")}
                  onBlur={() => setFocusedInput(null)}
                  placeholder="••••••••"
                  style={{
                    ...styles.input,
                    ...(focusedInput === "password" ? styles.inputFocused : {})
                  }}
                  className="form-input"
                />
              </div>
            </div>

            <button
              onClick={handleCreate}
              disabled={creating || !name.trim() || !email.trim() || !password.trim()}
              style={{
                ...styles.primaryBtn,
                ...(creating || !name.trim() || !email.trim() || !password.trim() ? styles.primaryBtnDisabled : {})
              }}
              className="create-btn"
            >
              {creating ? (
                <>
                  <div className="button-spinner-light"></div>
                  <span>Creating Employee...</span>
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  <span>Create Employee</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function KpiCard({ label, value, delay, accent = "#D4A574", icon }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        ...styles.kpiCard,
        animationDelay: delay,
        transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: isHovered
          ? '0 12px 28px rgba(212, 165, 116, 0.18)'
          : '0 2px 8px rgba(0, 0, 0, 0.04)'
      }}
      className="kpi-card"
    >
      <div style={styles.kpiGlow}></div>
      <div style={{ ...styles.kpiIcon, color: accent }}>
        {icon}
      </div>
      <div style={styles.kpiContent}>
        <p style={styles.kpiValue}>{value}</p>
        <p style={styles.kpiLabel}>{label}</p>
      </div>
    </div>
  );
}

/* ===========================
   STYLES
=========================== */
const styles = {
  page: {
    display: "flex",
    flexDirection: "column",
    gap: 48,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    maxWidth: 1400,
    margin: "0 auto"
  },

  /* LOADING STATE */
  loadingState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "80px 20px",
    gap: 20,
    minHeight: "60vh"
  },

  loadingText: {
    fontSize: 15,
    color: "#64748B",
    fontWeight: 600
  },

  /* KPI STRIP */
  kpiStrip: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 24
  },

  kpiCard: {
    position: "relative",
    background: "linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)",
    border: "1px solid rgba(212, 165, 116, 0.2)",
    borderRadius: 20,
    padding: 28,
    display: "flex",
    alignItems: "center",
    gap: 20,
    overflow: "hidden",
    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
    cursor: "pointer",
    animation: "kpi-fade-in 0.6s cubic-bezier(0.4, 0, 0.2, 1) backwards"
  },

  kpiGlow: {
    position: "absolute",
    top: -50,
    right: -50,
    width: 150,
    height: 150,
    background: "radial-gradient(circle, rgba(245, 158, 11, 0.15) 0%, transparent 70%)",
    borderRadius: "50%",
    pointerEvents: "none"
  },

  kpiIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    background: "rgba(255, 255, 255, 0.6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    boxShadow: "0 4px 12px rgba(212, 165, 116, 0.15)"
  },

  kpiContent: {
    display: "flex",
    flexDirection: "column",
    gap: 4
  },

  kpiValue: {
    fontSize: 36,
    fontWeight: 800,
    color: "#78350F",
    margin: 0,
    letterSpacing: "-1.5px",
    lineHeight: 1
  },

  kpiLabel: {
    fontSize: 13,
    fontWeight: 600,
    color: "#92400E",
    margin: 0,
    textTransform: "uppercase",
    letterSpacing: "0.5px"
  },

  /* HEADER */
  pageTitle: {
    fontSize: 42,
    fontWeight: 800,
    color: "#1F2937",
    margin: "0 0 8px 0",
    letterSpacing: "-1px"
  },

  pageSubtitle: {
    fontSize: 16,
    color: "#64748B",
    margin: 0,
    fontWeight: 500
  },

  /* ORG SELECTOR */
  orgSelectorCard: {
    position: "relative",
    background: "linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)",
    border: "2px solid rgba(212, 165, 116, 0.3)",
    borderRadius: 20,
    padding: 32,
    overflow: "hidden"
  },

  orgSelectorGlow: {
    position: "absolute",
    top: -80,
    right: -80,
    width: 200,
    height: 200,
    background: "radial-gradient(circle, rgba(245, 158, 11, 0.12) 0%, transparent 70%)",
    borderRadius: "50%",
    pointerEvents: "none"
  },

  orgSelectorContent: {
    position: "relative",
    zIndex: 1
  },

  orgLabel: {
    display: "block",
    fontSize: 15,
    fontWeight: 700,
    color: "#78350F",
    marginBottom: 12,
    letterSpacing: "0.3px"
  },

  selectWrapper: {
    position: "relative",
    maxWidth: 500
  },

  select: {
    width: "100%",
    padding: "14px 40px 14px 18px",
    borderRadius: 14,
    border: "2px solid rgba(212, 165, 116, 0.3)",
    background: "rgba(255, 255, 255, 0.9)",
    fontSize: 15,
    fontWeight: 500,
    color: "#1F2937",
    outline: "none",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    fontFamily: "inherit",
    cursor: "pointer",
    appearance: "none"
  },

  selectIcon: {
    position: "absolute",
    right: 14,
    top: "50%",
    transform: "translateY(-50%)",
    color: "#D97706",
    pointerEvents: "none"
  },

  /* SECTION TITLE */
  sectionTitle: {
    fontSize: 24,
    fontWeight: 700,
    color: "#1F2937",
    marginBottom: 20,
    letterSpacing: "-0.5px"
  },

  /* USER GRID */
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
    gap: 24
  },

  userCard: {
    position: "relative",
    background: "#FFFFFF",
    border: "1px solid #E5E7EB",
    borderRadius: 20,
    padding: 28,
    display: "flex",
    flexDirection: "column",
    gap: 20,
    overflow: "hidden",
    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
    animation: "card-fade-in 0.5s cubic-bezier(0.4, 0, 0.2, 1) backwards"
  },

  cardGlow: {
    position: "absolute",
    top: -60,
    right: -60,
    width: 180,
    height: 180,
    background: "radial-gradient(circle, rgba(245, 158, 11, 0.08) 0%, transparent 70%)",
    borderRadius: "50%",
    pointerEvents: "none",
    opacity: 0,
    transition: "opacity 0.4s ease"
  },

  userAvatar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4
  },

  avatarInner: {
    width: 72,
    height: 72,
    borderRadius: 18,
    background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 28,
    fontWeight: 800,
    color: "#FFFFFF",
    letterSpacing: "-0.5px",
    boxShadow: "0 8px 20px rgba(245, 158, 11, 0.25)"
  },

  userInfo: {
    textAlign: "center"
  },

  userName: {
    fontSize: 20,
    fontWeight: 700,
    color: "#1F2937",
    margin: "0 0 6px 0",
    letterSpacing: "-0.3px"
  },

  userEmail: {
    fontSize: 14,
    color: "#64748B",
    margin: 0,
    fontWeight: 500,
    wordBreak: "break-word"
  },

  userMeta: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    paddingTop: 16,
    borderTop: "1px solid rgba(212, 165, 116, 0.15)"
  },

  metaRow: {
    display: "flex",
    justifyContent: "center"
  },

  roleBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 14px",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 700,
    textTransform: "capitalize",
    letterSpacing: "0.3px"
  },

  roleBadgeAdmin: {
    background: "rgba(254, 243, 199, 0.5)",
    color: "#92400E",
    border: "1px solid rgba(245, 158, 11, 0.3)"
  },

  roleBadgeEmployee: {
    background: "rgba(241, 245, 249, 0.8)",
    color: "#64748B",
    border: "1px solid rgba(100, 116, 139, 0.2)"
  },

  roleDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    flexShrink: 0
  },

  orgIndicator: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    fontSize: 13,
    color: "#64748B",
    margin: 0,
    fontWeight: 600
  },

  orgIcon: {
    flexShrink: 0,
    opacity: 0.6
  },

  /* EMPTY STATE */
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "100px 20px",
    background: "linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)",
    borderRadius: 24,
    border: "2px dashed rgba(212, 165, 116, 0.3)"
  },

  emptyIcon: {
    marginBottom: 24,
    opacity: 0.4
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: 700,
    color: "#78350F",
    margin: "0 0 8px 0"
  },

  emptyText: {
    fontSize: 15,
    color: "#92400E",
    margin: 0,
    textAlign: "center",
    maxWidth: 400
  },

  /* CREATE SECTION */
  createCard: {
    position: "relative",
    background: "linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)",
    border: "2px solid rgba(212, 165, 116, 0.3)",
    borderRadius: 24,
    padding: 40,
    overflow: "hidden",
    animation: "create-fade-in 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.3s backwards"
  },

  createGlow: {
    position: "absolute",
    top: -100,
    left: -100,
    width: 300,
    height: 300,
    background: "radial-gradient(circle, rgba(245, 158, 11, 0.12) 0%, transparent 70%)",
    borderRadius: "50%",
    pointerEvents: "none",
    animation: "glow-pulse 4s ease-in-out infinite"
  },

  createContent: {
    position: "relative",
    zIndex: 1
  },

  createTitle: {
    fontSize: 24,
    fontWeight: 700,
    color: "#78350F",
    margin: "0 0 8px 0",
    letterSpacing: "-0.5px"
  },

  createHint: {
    fontSize: 15,
    color: "#92400E",
    marginBottom: 28,
    lineHeight: 1.6,
    fontWeight: 500
  },

  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: 20,
    marginBottom: 24
  },

  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 8
  },

  label: {
    fontSize: 14,
    fontWeight: 700,
    color: "#78350F",
    letterSpacing: "0.2px"
  },

  input: {
    width: "100%",
    padding: "14px 18px",
    borderRadius: 14,
    border: "2px solid rgba(212, 165, 116, 0.3)",
    background: "rgba(255, 255, 255, 0.9)",
    fontSize: 15,
    fontWeight: 500,
    color: "#1F2937",
    outline: "none",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    fontFamily: "inherit",
    boxSizing: "border-box"
  },

  inputFocused: {
    borderColor: "#F59E0B",
    background: "#FFFFFF",
    boxShadow: "0 0 0 4px rgba(245, 158, 11, 0.1)"
  },

  primaryBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: "14px 32px",
    background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
    color: "#FFFFFF",
    border: "none",
    borderRadius: 14,
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    fontFamily: "inherit",
    boxShadow: "0 4px 12px rgba(245, 158, 11, 0.3)",
    whiteSpace: "nowrap"
  },

  primaryBtnDisabled: {
    opacity: 0.5,
    cursor: "not-allowed"
  }
};

/* ===========================
   ANIMATIONS & GLOBAL STYLES
=========================== */
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

  @keyframes kpi-fade-in {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes header-fade-in {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes content-fade-in {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes card-fade-in {
    from {
      opacity: 0;
      transform: translateY(20px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  @keyframes create-fade-in {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes glow-pulse {
    0%, 100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.8;
      transform: scale(1.05);
    }
  }

  .kpi-fade-in {
    animation: kpi-fade-in 0.6s cubic-bezier(0.4, 0, 0.2, 1) backwards;
  }

  .header-fade-in {
    animation: header-fade-in 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.1s backwards;
  }

  .content-fade-in {
    animation: content-fade-in 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.2s backwards;
  }

  .create-fade-in {
    animation: create-fade-in 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.3s backwards;
  }

  .user-card:hover {
    transform: translateY(-6px);
    box-shadow: 0 16px 40px rgba(212, 165, 116, 0.15);
  }

  .user-card:hover .card-glow-active {
    opacity: 1;
  }

  .create-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(245, 158, 11, 0.4);
  }

  .create-btn:active:not(:disabled) {
    transform: translateY(0);
  }

  .loading-spinner {
    width: 48px;
    height: 48px;
    border: 4px solid rgba(212, 165, 116, 0.2);
    border-top-color: #F59E0B;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  .button-spinner-light {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.4);
    border-top-color: #FFFFFF;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  * {
    box-sizing: border-box;
  }
`;

if (typeof document !== 'undefined' && !document.getElementById('users-page-styles')) {
  styleSheet.id = 'users-page-styles';
  document.head.appendChild(styleSheet);
}

export default UsersPage;