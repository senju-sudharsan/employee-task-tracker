import { signOut } from "firebase/auth";
import { auth } from "../firebase";

/* ─── design tokens (same as app) ──────────────────────────────── */
const T = {
  cream: "#FAF8F3",
  offWhite: "#FEFDFB",
  white: "#fff",
  cyan: "#06B6D4",
  cyanDark: "#0891B2",
  slate: "#64748B",
  slateDark: "#475569",
  gray: "#F1F5F9",
  border: "#E2E8F0",
  textPrimary: "#1E293B",
  textSecondary: "#64748B",
  danger: "#EF4444",
  dangerDark: "#991B1B"
};

/* ─── icon ────────────────────────────────────────────────────── */
const BlockIcon = () => (
  <svg width="64" height="64" fill="none" stroke={T.danger} viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
    />
  </svg>
);

/* ─── page ────────────────────────────────────────────────────── */
export default function OrganizationDisabledPage() {
  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <div
      style={{
        background: T.cream,
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Poppins, sans-serif",
        padding: "2rem"
      }}
    >
      <div
        style={{
          background: T.offWhite,
          border: `1px solid ${T.border}`,
          borderRadius: 16,
          padding: "3rem",
          maxWidth: 560,
          width: "100%",
          textAlign: "center",
          boxShadow: "0 4px 24px rgba(0,0,0,0.04)"
        }}
      >
        {/* ICON */}
        <div
          style={{
            width: 96,
            height: 96,
            borderRadius: 20,
            background:
              "linear-gradient(135deg, rgba(239,68,68,0.08), rgba(239,68,68,0.12))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 2rem"
          }}
        >
          <BlockIcon />
        </div>

        {/* TITLE */}
        <h1
          style={{
            fontSize: "2rem",
            fontWeight: 600,
            color: T.textPrimary,
            marginBottom: "1rem"
          }}
        >
          Organization Disabled
        </h1>

        {/* TEXT */}
        <p
          style={{
            fontSize: "1rem",
            color: T.textSecondary,
            lineHeight: 1.6,
            marginBottom: "2.5rem"
          }}
        >
          Your organization has been disabled by the Super Admin.  
          Access to all features has been temporarily restricted.
        </p>

        {/* ALERT */}
        <div
          style={{
            background:
              "linear-gradient(135deg, rgba(239,68,68,0.06), rgba(245,158,11,0.05))",
            border: "1px solid rgba(239,68,68,0.15)",
            borderRadius: 12,
            padding: "1rem 1.25rem",
            marginBottom: "2rem",
            textAlign: "left"
          }}
        >
          <div
            style={{
              fontSize: "0.875rem",
              fontWeight: 600,
              color: T.dangerDark,
              marginBottom: "0.25rem"
            }}
          >
            Access Restricted
          </div>
          <div style={{ fontSize: "0.8125rem", color: T.slate }}>
            Contact your administrator or support team to restore access.
          </div>
        </div>

        {/* LOGOUT */}
        <button
          onClick={handleLogout}
          style={{
            padding: "0.875rem 2rem",
            borderRadius: 10,
            fontSize: "0.9375rem",
            fontWeight: 500,
            border: `1px solid ${T.border}`,
            background: T.white,
            color: T.textPrimary,
            cursor: "pointer",
            width: "100%"
          }}
        >
          Logout
        </button>

        
      </div>
    </div>
  );
}
