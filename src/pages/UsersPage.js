import { useEffect, useState } from "react";
import { auth } from "../firebase";
import { getAllUsers, createEmployee, createAdminUser } from "../services/userService";
import { getUserProfile } from "../services/authService";
import { ROLES, roleCapabilities } from "../config/roles";
import { getAllOrganizations } from "../services/organizationService";

/* ─────────────────────────────────────────────────────────────
   Animations & global styles — injected once
───────────────────────────────────────────────────────────── */
if (typeof document !== "undefined" && !document.getElementById("users-page-styles")) {
  const s = document.createElement("style");
  s.id = "users-page-styles";
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

    *, *::before, *::after { box-sizing: border-box; }

    @keyframes kpi-fade-in {
      from { opacity:0; transform:translateY(20px); }
      to   { opacity:1; transform:translateY(0); }
    }
    @keyframes header-fade-in {
      from { opacity:0; transform:translateY(20px); }
      to   { opacity:1; transform:translateY(0); }
    }
    @keyframes content-fade-in {
      from { opacity:0; transform:translateY(30px); }
      to   { opacity:1; transform:translateY(0); }
    }
    @keyframes card-fade-in {
      from { opacity:0; transform:translateY(20px) scale(0.95); }
      to   { opacity:1; transform:translateY(0) scale(1); }
    }
    @keyframes create-fade-in {
      from { opacity:0; transform:translateY(30px); }
      to   { opacity:1; transform:translateY(0); }
    }
    @keyframes glow-pulse {
      0%,100% { opacity:1; transform:scale(1); }
      50%      { opacity:.8; transform:scale(1.05); }
    }
    @keyframes spin { to { transform:rotate(360deg); } }
    @keyframes check-pop {
      0%   { transform:scale(0.6); }
      60%  { transform:scale(1.15); }
      100% { transform:scale(1); }
    }

    .kpi-fade-in     { animation: kpi-fade-in     0.6s cubic-bezier(.4,0,.2,1) backwards; }
    .header-fade-in  { animation: header-fade-in  0.6s cubic-bezier(.4,0,.2,1) 0.1s backwards; }
    .content-fade-in { animation: content-fade-in 0.6s cubic-bezier(.4,0,.2,1) 0.2s backwards; }
    .create-fade-in  { animation: create-fade-in  0.8s cubic-bezier(.4,0,.2,1) 0.3s backwards; }

    .user-card:hover { transform:translateY(-6px); box-shadow:0 16px 40px rgba(212,165,116,.15); }
    .user-card:hover .card-glow-active { opacity:1; }

    .create-btn:hover:not(:disabled) {
      transform:translateY(-2px);
      box-shadow:0 10px 28px rgba(245,158,11,.42);
    }
    .create-btn:active:not(:disabled) { transform:translateY(0); }
    .create-btn:disabled { cursor:not-allowed; }

    .loading-spinner {
      width:48px; height:48px;
      border:4px solid rgba(212,165,116,.2);
      border-top-color:#F59E0B;
      border-radius:50%;
      animation:spin .8s linear infinite;
    }
    .button-spinner-light {
      width:16px; height:16px;
      border:2px solid rgba(255,255,255,.4);
      border-top-color:#FFF;
      border-radius:50%;
      animation:spin .6s linear infinite;
    }

    /* org / role select focus ring */
    .up-select:focus {
      border-color:#F59E0B !important;
      box-shadow:0 0 0 4px rgba(245,158,11,.12) !important;
      outline:none;
    }

    /* confirmation label hover */
    .confirm-label:hover {
      border-color:rgba(245,158,11,.45) !important;
      background:rgba(255,255,255,.85) !important;
    }
    .confirm-label:hover .confirm-custom-box {
      border-color:rgba(245,158,11,.65) !important;
    }

    /* check mark pop animation */
    .check-appear { animation: check-pop .22s cubic-bezier(.4,0,.2,1) forwards; }

    /* role select: hide default arrow on all browsers */
    .up-role-select { appearance:none; -webkit-appearance:none; }
  `;
  document.head.appendChild(s);
}

/* ─────────────────────────────────────────────────────────────
   UsersPage
───────────────────────────────────────────────────────────── */
function UsersPage() {
  const [users,          setUsers]          = useState([]);
  const [organizations,  setOrganizations]  = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [profile,        setProfile]        = useState(null);
  const [selectedOrgId,  setSelectedOrgId]  = useState(null);

  // form
  const [name,           setName]           = useState("");
  const [email,          setEmail]          = useState("");
  const [password,       setPassword]       = useState("");
  const [selectedRole,   setSelectedRole]   = useState(ROLES.EMPLOYEE);
  const [confirmed,      setConfirmed]      = useState(false);
  const [creating,       setCreating]       = useState(false);
  const [focusedInput,   setFocusedInput]   = useState(null);

  /* ── BOOTSTRAP ── */
  useEffect(() => {
    const bootstrap = async () => {
      if (!auth.currentUser) return;

      const userProfile = await getUserProfile(auth.currentUser.uid);
      setProfile(userProfile);
      const role = userProfile.role;

      if (!roleCapabilities[role]?.canManageUsers) {
        alert("Access denied");
        setLoading(false);
        return;
      }

      if (role === ROLES.SUPERADMIN) {
        const orgs = await getAllOrganizations();
        setOrganizations(orgs || []);
      }

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

  /* ── CREATE MEMBER ── */
  const handleCreate = async () => {
    if (!name || !email || !password || !selectedOrgId) {
      alert("All fields are required");
      return;
    }
    if (!confirmed) {
      alert("Please confirm access before creating a member.");
      return;
    }

    setCreating(true);
    try {
      const payload = {
        name,
        email,
        password,
        organizationId: selectedOrgId,
        createdBy: auth.currentUser.uid,
      };

      if (selectedRole === ROLES.ADMIN) {
        await createAdminUser(payload);
      } else {
        await createEmployee(payload);
      }

      setName(""); setEmail(""); setPassword("");
      setSelectedRole(ROLES.EMPLOYEE);
      setConfirmed(false);

      const updated = await getAllUsers();
      setUsers(updated || []);
    } catch (err) {
      alert(err.message);
    }
    setCreating(false);
  };

  /* ── DERIVED STATE ── */
  const isSuperAdmin   = profile?.role === ROLES.SUPERADMIN;
  const visibleUsers   = selectedOrgId ? users.filter((u) => u.organizationId === selectedOrgId) : [];
  const totalUsers     = visibleUsers.length;
  const adminCount     = visibleUsers.filter((u) => u.role === ROLES.ADMIN).length;
  const employeeCount  = visibleUsers.filter((u) => u.role === ROLES.EMPLOYEE).length;
  const isFormReady    = name.trim() && email.trim() && password.trim() && confirmed;

  /* ── LOADING ── */
  if (loading) {
    return (
      <div style={sx.loadingState}>
        <div className="loading-spinner" />
        <p style={sx.loadingText}>Loading workspace…</p>
      </div>
    );
  }

  return (
    <div style={sx.page}>

      {/* ══════════ KPI STRIP ══════════ */}
      {selectedOrgId && (
        <div style={sx.kpiStrip} className="kpi-fade-in">
          <KpiCard label="Total Users" value={totalUsers} delay="0s"
            icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
          />
          <KpiCard label="Admins" value={adminCount} delay="0.1s" accent="#F59E0B"
            icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>}
          />
          <KpiCard label="Employees" value={employeeCount} delay="0.2s" accent="#D97706"
            icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
          />
        </div>
      )}

      {/* ══════════ HEADER ══════════ */}
      <div className="header-fade-in">
        <h1 style={sx.pageTitle}>User Management</h1>
        <p style={sx.pageSubtitle}>Manage team members and access controls across your organization</p>
      </div>

      {/* ══════════ SUPER ADMIN ORG SELECT ══════════ */}
      {isSuperAdmin && (
        <div style={sx.orgSelectorCard} className="content-fade-in">
          <div style={sx.orgSelectorGlow} />
          <div style={sx.orgSelectorContent}>
            <label style={sx.orgLabel}>Select Organization</label>
            <div style={sx.selectWrapper}>
              <select
                value={selectedOrgId || ""}
                onChange={(e) => setSelectedOrgId(e.target.value)}
                style={sx.select}
                className="up-select"
              >
                <option value="">Choose an organization to manage</option>
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>{org.name}</option>
                ))}
              </select>
              <ChevronIcon style={sx.selectIcon} color="#D97706" />
            </div>
          </div>
        </div>
      )}

      {/* ══════════ EMPTY — NO ORG SELECTED ══════════ */}
      {isSuperAdmin && !selectedOrgId && (
        <div style={sx.emptyState} className="content-fade-in">
          <EmptyOrgSvg />
          <p style={sx.emptyTitle}>Select an Organization</p>
          <p style={sx.emptyText}>Choose an organization from above to view and manage team members</p>
        </div>
      )}

      {/* ══════════ USERS GRID ══════════ */}
      {selectedOrgId && visibleUsers.length > 0 && (
        <div className="content-fade-in">
          <h2 style={sx.sectionTitle}>Team Members</h2>
          <div style={sx.grid}>
            {visibleUsers.map((u, idx) => {
              const isAdmin  = u.role === ROLES.ADMIN;
              const initial  = u.name?.charAt(0)?.toUpperCase() || "U";
              const orgName  = organizations.find((org) => org.id === u.organizationId)?.name || "Organization";
              return (
                <div key={u.id} style={{ ...sx.userCard, animationDelay: `${idx * 0.05}s` }} className="user-card">
                  <div style={sx.cardGlow} className="card-glow-active" />
                  <div style={sx.userAvatar}>
                    <div style={sx.avatarInner}>{initial}</div>
                  </div>
                  <div style={sx.userInfo}>
                    <h3 style={sx.userName}>{u.name}</h3>
                    <p style={sx.userEmail}>{u.email}</p>
                  </div>
                  <div style={sx.userMeta}>
                    <div style={sx.metaRow}>
                      <span style={{ ...sx.roleBadge, ...(isAdmin ? sx.roleBadgeAdmin : sx.roleBadgeEmployee) }}>
                        <div style={{ ...sx.roleDot, backgroundColor: isAdmin ? "#F59E0B" : "#64748B" }} />
                        {isAdmin ? "Admin" : "Employee"}
                      </span>
                    </div>
                    <p style={sx.orgIndicator}>
                      <GridIcon style={sx.orgIcon} />
                      {orgName}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══════════ EMPTY — NO USERS ══════════ */}
      {selectedOrgId && visibleUsers.length === 0 && (
        <div style={sx.emptyState} className="content-fade-in">
          <EmptyUsersSvg />
          <p style={sx.emptyTitle}>No Team Members Yet</p>
          <p style={sx.emptyText}>Get started by creating your first member below</p>
        </div>
      )}

      {/* ══════════ CREATE NEW MEMBER ══════════ */}
      {selectedOrgId && (
        <div style={sx.createCard} className="create-fade-in">
          <div style={sx.createGlow} />

          <div style={sx.createContent}>
            {/* header row */}
            <div style={sx.createHeaderRow}>
              <div style={sx.createIconWrap}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                  stroke="#D97706" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <line x1="19" y1="8" x2="19" y2="14"/>
                  <line x1="22" y1="11" x2="16" y2="11"/>
                </svg>
              </div>
              <div>
                <h3 style={sx.createTitle}>Create New Member</h3>
                <p style={sx.createHint}>
                  Add a team member with a temporary password they can change on first login.
                </p>
              </div>
            </div>

            {/* ── form grid: name | email | password | role ── */}
            <div style={sx.formGrid}>

              {/* Name */}
              <div style={sx.inputGroup}>
                <label style={sx.label}>Full Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onFocus={() => setFocusedInput("name")}
                  onBlur={() => setFocusedInput(null)}
                  placeholder="Jane Smith"
                  style={{ ...sx.input, ...(focusedInput === "name" ? sx.inputFocused : {}) }}
                  className="form-input"
                />
              </div>

              {/* Email */}
              <div style={sx.inputGroup}>
                <label style={sx.label}>Email Address</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedInput("email")}
                  onBlur={() => setFocusedInput(null)}
                  placeholder="jane@company.com"
                  style={{ ...sx.input, ...(focusedInput === "email" ? sx.inputFocused : {}) }}
                  className="form-input"
                />
              </div>

              {/* Password */}
              <div style={sx.inputGroup}>
                <label style={sx.label}>Temporary Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedInput("password")}
                  onBlur={() => setFocusedInput(null)}
                  placeholder="••••••••"
                  style={{ ...sx.input, ...(focusedInput === "password" ? sx.inputFocused : {}) }}
                  className="form-input"
                />
              </div>

              {/* Role selector */}
              <div style={sx.inputGroup}>
                <label style={sx.label}>
                  Role
                  {!isSuperAdmin && (
                    <span style={sx.roleLockNote}>· Employee only</span>
                  )}
                </label>

                <div style={sx.roleSelectWrap}>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    disabled={!isSuperAdmin}
                    onFocus={() => setFocusedInput("role")}
                    onBlur={() => setFocusedInput(null)}
                    style={{
                      ...sx.input,
                      ...sx.roleSelect,
                      ...(focusedInput === "role" ? sx.inputFocused : {}),
                      ...(!isSuperAdmin ? sx.roleSelectLocked : {}),
                    }}
                    className="up-select up-role-select"
                  >
                    <option value={ROLES.EMPLOYEE}>Employee</option>
                    {isSuperAdmin && (
                      <option value={ROLES.ADMIN}>Admin</option>
                    )}
                  </select>

                  {/* chevron */}
                  <ChevronIcon
                    style={sx.roleChevron}
                    color={isSuperAdmin ? "#D97706" : "#A0AEC0"}
                  />

                  {/* live role pill */}
                  <div style={{
                    ...sx.rolePill,
                    ...(selectedRole === ROLES.ADMIN ? sx.rolePillAdmin : sx.rolePillEmployee),
                  }}>
                    <div style={{
                      ...sx.rolePillDot,
                      background: selectedRole === ROLES.ADMIN ? "#F59E0B" : "#94A3B8",
                    }} />
                    {selectedRole === ROLES.ADMIN ? "Admin" : "Employee"}
                  </div>
                </div>

                {/* admin elevation notice */}
                {isSuperAdmin && selectedRole === ROLES.ADMIN && (
                  <div style={sx.adminNotice}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                      stroke="#D97706" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                      <line x1="12" y1="9" x2="12" y2="13"/>
                      <line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                    Admin accounts have elevated permissions across the organization.
                  </div>
                )}
              </div>

            </div>

            {/* ── Confirmation checkbox ── */}
            <label htmlFor="up-confirm-cb" className="confirm-label" style={sx.confirmWrap}>
              {/* visually hidden native input — htmlFor handles click */}
              <input
                id="up-confirm-cb"
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                style={{ position: "absolute", opacity: 0, width: 0, height: 0, pointerEvents: "none" }}
              />

              {/* custom checkbox */}
              <div
                className="confirm-custom-box"
                style={{
                  ...sx.confirmBox,
                  ...(confirmed ? sx.confirmBoxChecked : {}),
                }}
              >
                {confirmed && (
                  <svg className="check-appear" width="11" height="11" viewBox="0 0 24 24" fill="none"
                    stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>

              <span style={sx.confirmText}>
                I confirm this member should be granted access to this organization
                {selectedRole === ROLES.ADMIN && isSuperAdmin && (
                  <strong style={{ color: "#92400E" }}> with Admin privileges</strong>
                )}.
              </span>
            </label>

            {/* ── Submit ── */}
            <div style={sx.submitRow}>
              <button
                onClick={handleCreate}
                disabled={creating || !isFormReady}
                style={{
                  ...sx.primaryBtn,
                  ...((creating || !isFormReady) ? sx.primaryBtnDisabled : {}),
                }}
                className="create-btn"
              >
                {creating ? (
                  <>
                    <div className="button-spinner-light" />
                    <span>Creating member…</span>
                  </>
                ) : (
                  <>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2.8" strokeLinecap="round">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5"  y1="12" x2="19" y2="12" />
                    </svg>
                    <span>
                      Create {selectedRole === ROLES.ADMIN ? "Admin" : "Employee"}
                    </span>
                  </>
                )}
              </button>

              {/* helper hint when button is locked */}
              {!isFormReady && !creating && (
                <p style={sx.submitHint}>
                  {!confirmed
                    ? "Check the confirmation box above to continue"
                    : "Fill in all fields to continue"}
                </p>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   KpiCard — unchanged
───────────────────────────────────────────────────────────── */
function KpiCard({ label, value, delay, accent = "#D4A574", icon }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...sx.kpiCard,
        animationDelay: delay,
        transform:  hovered ? "translateY(-4px)" : "translateY(0)",
        boxShadow:  hovered
          ? "0 12px 28px rgba(212,165,116,.18)"
          : "0 2px 8px rgba(0,0,0,.04)",
      }}
      className="kpi-card"
    >
      <div style={sx.kpiGlow} />
      <div style={{ ...sx.kpiIcon, color: accent }}>{icon}</div>
      <div style={sx.kpiContent}>
        <p style={sx.kpiValue}>{value}</p>
        <p style={sx.kpiLabel}>{label}</p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Tiny icon helpers (keeps JSX cleaner)
───────────────────────────────────────────────────────────── */
const ChevronIcon = ({ style, color = "currentColor" }) => (
  <svg style={style} width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const GridIcon = ({ style }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={style}>
    <rect x="3"  y="3"  width="7" height="7" rx="1" />
    <rect x="14" y="3"  width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
    <rect x="3"  y="14" width="7" height="7" rx="1" />
  </svg>
);
const EmptyOrgSvg = () => (
  <svg width="80" height="80" viewBox="0 0 80 80" fill="none" style={{ marginBottom: 24, opacity: 0.4 }}>
    <circle cx="40" cy="40" r="30" stroke="#D4A574" strokeWidth="2" opacity="0.3" />
    <path d="M40 25v20M40 55h.02" stroke="#D4A574" strokeWidth="3" strokeLinecap="round" />
  </svg>
);
const EmptyUsersSvg = () => (
  <svg width="80" height="80" viewBox="0 0 80 80" fill="none" style={{ marginBottom: 24, opacity: 0.4 }}>
    <circle cx="40" cy="40" r="30" stroke="#D4A574" strokeWidth="2" opacity="0.3" />
    <path d="M25 40h30M40 25v30" stroke="#D4A574" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

/* ─────────────────────────────────────────────────────────────
   Styles
───────────────────────────────────────────────────────────── */
const sx = {
  page: {
    display: "flex", flexDirection: "column", gap: 48,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    maxWidth: 1400, margin: "0 auto",
  },

  loadingState: {
    display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    padding: "80px 20px", gap: 20, minHeight: "60vh",
  },
  loadingText: { fontSize: 15, color: "#64748B", fontWeight: 600 },

  /* ── kpi ── */
  kpiStrip: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 24 },
  kpiCard: {
    position: "relative",
    background: "linear-gradient(135deg,#FFFBEB 0%,#FEF3C7 100%)",
    border: "1px solid rgba(212,165,116,.2)", borderRadius: 20,
    padding: 28, display: "flex", alignItems: "center", gap: 20,
    overflow: "hidden",
    transition: "all .4s cubic-bezier(.4,0,.2,1)", cursor: "pointer",
    animation: "kpi-fade-in .6s cubic-bezier(.4,0,.2,1) backwards",
  },
  kpiGlow: {
    position: "absolute", top: -50, right: -50, width: 150, height: 150,
    background: "radial-gradient(circle,rgba(245,158,11,.15) 0%,transparent 70%)",
    borderRadius: "50%", pointerEvents: "none",
  },
  kpiIcon: {
    width: 56, height: 56, borderRadius: 16,
    background: "rgba(255,255,255,.6)",
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0, boxShadow: "0 4px 12px rgba(212,165,116,.15)",
  },
  kpiContent: { display: "flex", flexDirection: "column", gap: 4 },
  kpiValue:   { fontSize: 36, fontWeight: 800, color: "#78350F", margin: 0, letterSpacing: "-1.5px", lineHeight: 1 },
  kpiLabel:   { fontSize: 13, fontWeight: 600, color: "#92400E", margin: 0, textTransform: "uppercase", letterSpacing: "0.5px" },

  /* ── page header ── */
  pageTitle:    { fontSize: 42, fontWeight: 800, color: "#1F2937", margin: "0 0 8px 0", letterSpacing: "-1px" },
  pageSubtitle: { fontSize: 16, color: "#64748B", margin: 0, fontWeight: 500 },

  /* ── org selector ── */
  orgSelectorCard: {
    position: "relative",
    background: "linear-gradient(135deg,#FFFBEB 0%,#FEF3C7 100%)",
    border: "2px solid rgba(212,165,116,.3)", borderRadius: 20,
    padding: 32, overflow: "hidden",
  },
  orgSelectorGlow: {
    position: "absolute", top: -80, right: -80, width: 200, height: 200,
    background: "radial-gradient(circle,rgba(245,158,11,.12) 0%,transparent 70%)",
    borderRadius: "50%", pointerEvents: "none",
  },
  orgSelectorContent: { position: "relative", zIndex: 1 },
  orgLabel: { display: "block", fontSize: 15, fontWeight: 700, color: "#78350F", marginBottom: 12, letterSpacing: "0.3px" },
  selectWrapper: { position: "relative", maxWidth: 500 },
  select: {
    width: "100%", padding: "14px 40px 14px 18px", borderRadius: 14,
    border: "2px solid rgba(212,165,116,.3)",
    background: "rgba(255,255,255,.9)",
    fontSize: 15, fontWeight: 500, color: "#1F2937",
    outline: "none", transition: "all .3s cubic-bezier(.4,0,.2,1)",
    fontFamily: "inherit", cursor: "pointer", appearance: "none",
  },
  selectIcon: { position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" },

  /* ── section ── */
  sectionTitle: { fontSize: 24, fontWeight: 700, color: "#1F2937", marginBottom: 20, letterSpacing: "-0.5px" },

  /* ── user grid ── */
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 24 },
  userCard: {
    position: "relative", background: "#FFF",
    border: "1px solid #E5E7EB", borderRadius: 20,
    padding: 28, display: "flex", flexDirection: "column", gap: 20,
    overflow: "hidden", transition: "all .4s cubic-bezier(.4,0,.2,1)",
    animation: "card-fade-in .5s cubic-bezier(.4,0,.2,1) backwards",
  },
  cardGlow: {
    position: "absolute", top: -60, right: -60, width: 180, height: 180,
    background: "radial-gradient(circle,rgba(245,158,11,.08) 0%,transparent 70%)",
    borderRadius: "50%", pointerEvents: "none",
    opacity: 0, transition: "opacity .4s ease",
  },
  userAvatar: { display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 4 },
  avatarInner: {
    width: 72, height: 72, borderRadius: 18,
    background: "linear-gradient(135deg,#F59E0B 0%,#D97706 100%)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 28, fontWeight: 800, color: "#FFF",
    letterSpacing: "-0.5px", boxShadow: "0 8px 20px rgba(245,158,11,.25)",
  },
  userInfo: { textAlign: "center" },
  userName:  { fontSize: 20, fontWeight: 700, color: "#1F2937", margin: "0 0 6px 0", letterSpacing: "-0.3px" },
  userEmail: { fontSize: 14, color: "#64748B", margin: 0, fontWeight: 500, wordBreak: "break-word" },
  userMeta: { display: "flex", flexDirection: "column", gap: 12, paddingTop: 16, borderTop: "1px solid rgba(212,165,116,.15)" },
  metaRow:  { display: "flex", justifyContent: "center" },
  roleBadge: {
    display: "inline-flex", alignItems: "center", gap: 8,
    padding: "6px 14px", borderRadius: 8,
    fontSize: 13, fontWeight: 700, textTransform: "capitalize", letterSpacing: "0.3px",
  },
  roleBadgeAdmin:    { background: "rgba(254,243,199,.5)", color: "#92400E", border: "1px solid rgba(245,158,11,.3)" },
  roleBadgeEmployee: { background: "rgba(241,245,249,.8)", color: "#64748B", border: "1px solid rgba(100,116,139,.2)" },
  roleDot: { width: 8, height: 8, borderRadius: "50%", flexShrink: 0 },
  orgIndicator: { display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 13, color: "#64748B", margin: 0, fontWeight: 600 },
  orgIcon: { flexShrink: 0, opacity: 0.6 },

  /* ── empty ── */
  emptyState: {
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    padding: "100px 20px",
    background: "linear-gradient(135deg,#FFFBEB 0%,#FEF3C7 100%)",
    borderRadius: 24, border: "2px dashed rgba(212,165,116,.3)",
  },
  emptyTitle: { fontSize: 20, fontWeight: 700, color: "#78350F", margin: "0 0 8px 0" },
  emptyText:  { fontSize: 15, color: "#92400E", margin: 0, textAlign: "center", maxWidth: 400 },

  /* ── create card ── */
  createCard: {
    position: "relative",
    background: "linear-gradient(135deg,#FFFBEB 0%,#FEF3C7 100%)",
    border: "2px solid rgba(212,165,116,.3)", borderRadius: 24,
    padding: 40, overflow: "hidden",
    animation: "create-fade-in .8s cubic-bezier(.4,0,.2,1) .3s backwards",
  },
  createGlow: {
    position: "absolute", top: -100, left: -100, width: 300, height: 300,
    background: "radial-gradient(circle,rgba(245,158,11,.12) 0%,transparent 70%)",
    borderRadius: "50%", pointerEvents: "none",
    animation: "glow-pulse 4s ease-in-out infinite",
  },
  createContent: { position: "relative", zIndex: 1 },

  createHeaderRow: { display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 28 },
  createIconWrap: {
    width: 48, height: 48, borderRadius: 14, flexShrink: 0,
    background: "rgba(255,255,255,.7)",
    border: "1.5px solid rgba(212,165,116,.3)",
    display: "flex", alignItems: "center", justifyContent: "center",
    boxShadow: "0 4px 12px rgba(212,165,116,.15)",
  },
  createTitle: { fontSize: 22, fontWeight: 700, color: "#78350F", margin: "0 0 5px 0", letterSpacing: "-0.4px" },
  createHint:  { fontSize: 14, color: "#92400E", margin: 0, lineHeight: 1.6, fontWeight: 500 },

  /* form — 4 columns on wide, collapses cleanly */
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: 20, marginBottom: 24, alignItems: "start",
  },
  inputGroup: { display: "flex", flexDirection: "column", gap: 8 },
  label: { fontSize: 13.5, fontWeight: 700, color: "#78350F", letterSpacing: "0.2px" },

  input: {
    width: "100%", padding: "13px 16px", borderRadius: 12,
    border: "2px solid rgba(212,165,116,.3)",
    background: "rgba(255,255,255,.9)",
    fontSize: 14.5, fontWeight: 500, color: "#1F2937",
    outline: "none", transition: "all .3s cubic-bezier(.4,0,.2,1)",
    fontFamily: "inherit",
  },
  inputFocused: {
    borderColor: "#F59E0B", background: "#FFFFFF",
    boxShadow: "0 0 0 4px rgba(245,158,11,.10)",
  },

  /* role selector extras */
  roleLockNote: { fontSize: 11, fontWeight: 600, color: "#A0AEC0", marginLeft: 6, letterSpacing: "0.3px" },
  roleSelectWrap: { position: "relative", display: "flex", flexDirection: "column", gap: 8 },
  roleSelect: { paddingRight: 36, cursor: "pointer" },
  roleSelectLocked: {
    opacity: 0.65, cursor: "not-allowed",
    background: "rgba(248,250,252,.95)",
    borderColor: "rgba(212,165,116,.15)",
  },
  roleChevron: { position: "absolute", top: 15, right: 12, pointerEvents: "none" },

  rolePill: {
    display: "inline-flex", alignItems: "center", gap: 7,
    padding: "5px 11px", borderRadius: 8,
    fontSize: 12, fontWeight: 700, border: "1.5px solid",
    letterSpacing: "0.3px", alignSelf: "flex-start",
    transition: "all .25s ease",
  },
  rolePillAdmin:    { background: "rgba(254,243,199,.6)", color: "#92400E", borderColor: "rgba(245,158,11,.35)" },
  rolePillEmployee: { background: "rgba(241,245,249,.8)", color: "#64748B", borderColor: "rgba(100,116,139,.2)" },
  rolePillDot: { width: 6, height: 6, borderRadius: "50%", flexShrink: 0 },

  adminNotice: {
    display: "flex", alignItems: "center", gap: 7,
    fontSize: 12, color: "#92400E", fontWeight: 500,
    padding: "8px 12px", borderRadius: 8,
    background: "rgba(245,158,11,.08)",
    border: "1px solid rgba(245,158,11,.22)",
    marginTop: 4,
  },

  /* confirmation checkbox */
  confirmWrap: {
    display: "flex", alignItems: "flex-start", gap: 13,
    padding: "15px 18px", borderRadius: 13, marginBottom: 20,
    background: "rgba(255,255,255,.55)",
    border: "1.5px solid rgba(212,165,116,.28)",
    cursor: "pointer",
    transition: "border-color .2s, background .2s",
    userSelect: "none",
  },
  confirmBox: {
    width: 20, height: 20, borderRadius: 6, flexShrink: 0, marginTop: 1,
    border: "2px solid rgba(212,165,116,.5)",
    display: "flex", alignItems: "center", justifyContent: "center",
    transition: "all .2s cubic-bezier(.4,0,.2,1)",
    background: "transparent",
  },
  confirmBoxChecked: {
    background: "linear-gradient(135deg,#F59E0B,#D97706)",
    borderColor: "#D97706",
    boxShadow: "0 3px 10px rgba(245,158,11,.35)",
  },
  confirmText: {
    fontSize: 13.5, fontWeight: 500, color: "#78350F", lineHeight: 1.55,
    fontFamily: "inherit",
  },

  /* submit row */
  submitRow: { display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" },
  primaryBtn: {
    display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
    padding: "13px 30px",
    background: "linear-gradient(135deg,#F59E0B 0%,#D97706 100%)",
    color: "#FFF", border: "none", borderRadius: 13,
    fontSize: 15, fontWeight: 700, cursor: "pointer",
    transition: "all .3s cubic-bezier(.4,0,.2,1)",
    fontFamily: "inherit",
    boxShadow: "0 4px 14px rgba(245,158,11,.32)",
    whiteSpace: "nowrap",
  },
  primaryBtnDisabled: { opacity: 0.48, cursor: "not-allowed" },
  submitHint: { fontSize: 13, color: "#92400E", margin: 0, fontWeight: 500, opacity: 0.75 },
};

export default UsersPage;