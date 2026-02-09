import { useEffect, useState } from "react";
import {
  getAllOrganizations,
  createOrganization,
  toggleOrganizationStatus
} from "../services/organizationService";
import { auth } from "../firebase";

/* ===========================
   SVG ASSETS (public/)
=========================== */
const ORG_ACTIVE_SVG = "/org/org-active.svg";
const ORG_DISABLED_SVG = "/org/org-disabled.svg";
const ORG_CREATE_SVG = "/org/org-create.svg";

function OrganizationsPage() {
  const [orgs, setOrgs] = useState([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [togglingId, setTogglingId] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);
  const [focusedInput, setFocusedInput] = useState(false);

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

  const openConfirmModal = (org) => {
    setConfirmModal(org);
  };

  const closeConfirmModal = () => {
    setConfirmModal(null);
  };

  const handleToggle = async () => {
    if (!confirmModal) return;
    
    setTogglingId(confirmModal.id);
    closeConfirmModal();
    await toggleOrganizationStatus(confirmModal.id, confirmModal.status);
    await load();
    setTogglingId(null);
  };

  const activeCount = orgs.filter(o => o.status === "active").length;
  const disabledCount = orgs.filter(o => o.status === "disabled").length;

  return (
    <div style={styles.page}>
      {/* KPI STRIP */}
      <div style={styles.kpiStrip} className="kpi-fade-in">
        <KpiCard
          label="Total Organizations"
          value={orgs.length}
          delay="0s"
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
            </svg>
          }
        />
        <KpiCard
          label="Active"
          value={activeCount}
          delay="0.1s"
          accent="#F59E0B"
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
              <path d="M22 4L12 14.01l-3-3" />
            </svg>
          }
        />
        <KpiCard
          label="Disabled"
          value={disabledCount}
          delay="0.2s"
          accent="#64748B"
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
            </svg>
          }
        />
      </div>

      {/* HEADER */}
      <div className="header-fade-in">
        <h1 style={styles.pageTitle}>Organizations</h1>
        <p style={styles.pageSubtitle}>
          Manage organizations across the platform
        </p>
      </div>

      {/* ORGANIZATION GRID */}
      {loading ? (
        <div style={styles.loadingState}>
          <div className="loading-spinner"></div>
          <p style={styles.loadingText}>Loading organizations…</p>
        </div>
      ) : orgs.length === 0 ? (
        <div style={styles.emptyState} className="content-fade-in">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" style={styles.emptyIcon}>
            <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" stroke="#D4A574" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <p style={styles.emptyTitle}>No organizations yet</p>
          <p style={styles.emptyText}>Create your first organization to get started</p>
        </div>
      ) : (
        <div style={styles.grid} className="content-fade-in">
          {orgs.map((org, idx) => {
            const isDisabled = org.status === "disabled";
            const isToggling = togglingId === org.id;

            return (
              <div
                key={org.id}
                style={{
                  ...styles.card,
                  ...(isDisabled ? styles.cardDisabled : {}),
                  animationDelay: `${idx * 0.05}s`
                }}
                className="org-card"
              >
                {/* BACKGROUND GLOW */}
                <div style={styles.cardGlow} className={!isDisabled ? "card-glow-active" : ""}></div>

                {/* SVG ILLUSTRATION */}
                <img
                  src={isDisabled ? ORG_DISABLED_SVG : ORG_ACTIVE_SVG}
                  alt=""
                  style={styles.cardIllustration}
                  className="org-illustration"
                />

                {/* CONTENT */}
                <div style={styles.cardContent}>
                  <h3 style={styles.orgName}>{org.name}</h3>

                  <div style={styles.orgMetaGroup}>
                    <div style={styles.statusBadge}>
                      <div
                        style={{
                          ...styles.statusDot,
                          backgroundColor: isDisabled ? "#64748B" : "#F59E0B"
                        }}
                      ></div>
                      <span
                        style={{
                          ...styles.statusText,
                          color: isDisabled ? "#64748B" : "#92400E"
                        }}
                      >
                        {org.status}
                      </span>
                    </div>

                    <p style={styles.orgMeta}>
                      Created by: {org.createdBy?.slice(0, 6)}…
                    </p>

                    <p style={styles.orgId}>ID: {org.id.slice(0, 8)}…</p>
                  </div>
                </div>

                {/* TOGGLE BUTTON */}
                <button
                  onClick={() => openConfirmModal(org)}
                  disabled={isToggling}
                  style={{
                    ...styles.toggleBtn,
                    ...(isDisabled ? styles.enableBtn : styles.disableBtn),
                    ...(isToggling ? styles.toggleBtnDisabled : {})
                  }}
                  className="toggle-btn"
                >
                  {isToggling ? (
                    <>
                      <div className="button-spinner"></div>
                      <span>Updating…</span>
                    </>
                  ) : isDisabled ? (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Enable Organization</span>
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="15" y1="9" x2="9" y2="15" />
                        <line x1="9" y1="9" x2="15" y2="15" />
                      </svg>
                      <span>Disable Organization</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE ORGANIZATION */}
      <div style={styles.createCard} className="create-fade-in">
        <div style={styles.createGlow}></div>
        
        <img
          src={ORG_CREATE_SVG}
          alt=""
          style={styles.createIllustration}
          className="create-illustration"
        />

        <div style={styles.createContent}>
          <h3 style={styles.createTitle}>Create New Organization</h3>
          <p style={styles.createHint}>
            Organizations enable you to manage teams, assign admins, and organize employees.
          </p>

          <div style={styles.createRow}>
            <div style={styles.inputWrapper}>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onFocus={() => setFocusedInput(true)}
                onBlur={() => setFocusedInput(false)}
                placeholder="Organization name"
                style={{
                  ...styles.input,
                  ...(focusedInput ? styles.inputFocused : {})
                }}
                className="create-input"
              />
            </div>
            
            <button
              onClick={handleCreate}
              disabled={creating || !name.trim()}
              style={{
                ...styles.primaryBtn,
                ...(creating || !name.trim() ? styles.primaryBtnDisabled : {})
              }}
              className="create-btn"
            >
              {creating ? (
                <>
                  <div className="button-spinner-light"></div>
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  <span>Create</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* CONFIRMATION MODAL */}
      {confirmModal && (
        <ConfirmModal
          org={confirmModal}
          onConfirm={handleToggle}
          onCancel={closeConfirmModal}
        />
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

function ConfirmModal({ org, onConfirm, onCancel }) {
  const isDisabling = org.status === "active";

  return (
    <div style={styles.modalOverlay} className="modal-fade-in" onClick={onCancel}>
      <div
        style={styles.modalContent}
        className="modal-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div style={styles.modalHeader}>
          <div style={{
            ...styles.modalIcon,
            background: isDisabling
              ? 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)'
              : 'linear-gradient(135deg, #DCFCE7 0%, #BBF7D0 100%)'
          }}>
            {isDisabling ? (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2.5">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            ) : (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          <h3 style={styles.modalTitle}>
            {isDisabling ? 'Disable Organization?' : 'Enable Organization?'}
          </h3>
          <p style={styles.modalSubtitle}>{org.name}</p>
        </div>

        <div style={styles.modalBody}>
          <p style={styles.modalText}>
            {isDisabling ? (
              <>
                Disabling this organization will prevent all associated users from accessing the platform.
                <br /><br />
                <strong>You can re-enable it at any time.</strong>
              </>
            ) : (
              <>
                Enabling this organization will restore access for all associated users.
                <br /><br />
                <strong>They will be able to use the platform immediately.</strong>
              </>
            )}
          </p>
        </div>

        <div style={styles.modalActions}>
          <button
            onClick={onCancel}
            style={styles.modalCancelBtn}
            className="modal-btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              ...styles.modalConfirmBtn,
              background: isDisabling
                ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)'
                : 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)'
            }}
            className="modal-btn-primary"
          >
            {isDisabling ? 'Disable Organization' : 'Enable Organization'}
          </button>
        </div>
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

  /* LOADING & EMPTY STATES */
  loadingState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "80px 20px",
    gap: 20
  },

  loadingText: {
    fontSize: 15,
    color: "#64748B",
    fontWeight: 600
  },

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
    margin: 0
  },

  /* ORGANIZATION GRID */
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
    gap: 24
  },

  card: {
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

  cardDisabled: {
    opacity: 0.6,
    filter: "grayscale(0.3)"
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

  cardIllustration: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 100,
    height: 100,
    opacity: 0.12,
    pointerEvents: "none",
    animation: "float 6s ease-in-out infinite"
  },

  cardContent: {
    position: "relative",
    zIndex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 16
  },

  orgName: {
    fontSize: 20,
    fontWeight: 700,
    color: "#1F2937",
    margin: 0,
    letterSpacing: "-0.3px"
  },

  orgMetaGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 10
  },

  statusBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 14px",
    background: "rgba(254, 243, 199, 0.5)",
    borderRadius: 8,
    width: "fit-content"
  },

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    flexShrink: 0
  },

  statusText: {
    fontSize: 13,
    fontWeight: 700,
    textTransform: "capitalize",
    letterSpacing: "0.3px"
  },

  orgMeta: {
    fontSize: 14,
    color: "#64748B",
    margin: 0,
    fontWeight: 500
  },

  orgId: {
    fontSize: 12,
    color: "#94A3B8",
    margin: 0,
    fontFamily: "monospace"
  },

  /* TOGGLE BUTTON */
  toggleBtn: {
    position: "relative",
    zIndex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: "12px 20px",
    borderRadius: 12,
    border: "none",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    fontFamily: "inherit"
  },

  enableBtn: {
    background: "linear-gradient(135deg, #DCFCE7 0%, #BBF7D0 100%)",
    color: "#166534",
    boxShadow: "0 2px 8px rgba(34, 197, 94, 0.15)"
  },

  disableBtn: {
    background: "linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)",
    color: "#92400E",
    boxShadow: "0 2px 8px rgba(245, 158, 11, 0.15)"
  },

  toggleBtnDisabled: {
    opacity: 0.6,
    cursor: "not-allowed"
  },

  /* CREATE ORGANIZATION */
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

  createIllustration: {
    position: "absolute",
    right: 24,
    top: 24,
    width: 160,
    height: 160,
    opacity: 0.15,
    pointerEvents: "none",
    animation: "float 8s ease-in-out infinite"
  },

  createContent: {
    position: "relative",
    zIndex: 1,
    maxWidth: 700
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
    marginBottom: 24,
    lineHeight: 1.6,
    fontWeight: 500
  },

  createRow: {
    display: "grid",
    gridTemplateColumns: "1fr auto",
    gap: 16
  },

  inputWrapper: {
    position: "relative"
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
    fontFamily: "inherit"
  },

  inputFocused: {
    borderColor: "#F59E0B",
    background: "#FFFFFF",
    boxShadow: "0 0 0 4px rgba(245, 158, 11, 0.1)"
  },

  primaryBtn: {
    display: "flex",
    alignItems: "center",
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
  },

  /* MODAL */
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(15, 23, 42, 0.6)",
    backdropFilter: "blur(8px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    padding: 20
  },

  modalContent: {
    background: "#FFFFFF",
    borderRadius: 24,
    maxWidth: 480,
    width: "100%",
    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
    overflow: "hidden"
  },

  modalHeader: {
    padding: "40px 40px 24px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    gap: 12
  },

  modalIcon: {
    width: 72,
    height: 72,
    borderRadius: 18,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.1)"
  },

  modalTitle: {
    fontSize: 24,
    fontWeight: 700,
    color: "#1F2937",
    margin: 0,
    letterSpacing: "-0.5px"
  },

  modalSubtitle: {
    fontSize: 16,
    color: "#64748B",
    margin: 0,
    fontWeight: 600
  },

  modalBody: {
    padding: "0 40px 32px"
  },

  modalText: {
    fontSize: 15,
    color: "#64748B",
    lineHeight: 1.7,
    margin: 0,
    textAlign: "center"
  },

  modalActions: {
    display: "flex",
    gap: 12,
    padding: "24px 40px 40px",
    borderTop: "1px solid #F1F5F9"
  },

  modalCancelBtn: {
    flex: 1,
    padding: "14px 24px",
    background: "#F8FAFC",
    color: "#64748B",
    border: "none",
    borderRadius: 12,
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    fontFamily: "inherit"
  },

  modalConfirmBtn: {
    flex: 1,
    padding: "14px 24px",
    color: "#FFFFFF",
    border: "none",
    borderRadius: 12,
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    fontFamily: "inherit",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)"
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

  @keyframes modal-fade-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes modal-scale-in {
    from {
      opacity: 0;
      transform: scale(0.9);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  @keyframes float {
    0%, 100% {
      transform: translateY(0) rotate(0deg);
    }
    50% {
      transform: translateY(-10px) rotate(2deg);
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

  .modal-fade-in {
    animation: modal-fade-in 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .modal-scale-in {
    animation: modal-scale-in 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .org-card:hover {
    transform: translateY(-6px);
    box-shadow: 0 16px 40px rgba(212, 165, 116, 0.15);
  }

  .org-card:hover .card-glow-active {
    opacity: 1;
  }

  .toggle-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
  }

  .toggle-btn:active:not(:disabled) {
    transform: translateY(0);
  }

  .create-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(245, 158, 11, 0.4);
  }

  .create-btn:active:not(:disabled) {
    transform: translateY(0);
  }

  .modal-btn-secondary:hover {
    background: #E2E8F0;
  }

  .modal-btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  }

  .modal-btn-primary:active {
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

  .button-spinner,
  .button-spinner-light {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: currentColor;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }

  .button-spinner-light {
    border-color: rgba(255, 255, 255, 0.4);
    border-top-color: #FFFFFF;
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

if (typeof document !== 'undefined' && !document.getElementById('organizations-page-styles')) {
  styleSheet.id = 'organizations-page-styles';
  document.head.appendChild(styleSheet);
}

export default OrganizationsPage;