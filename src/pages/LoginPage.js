import { useState, useEffect } from "react";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  
} from "firebase/auth";
import { auth } from "../firebase";



const BG_ABSTRACT   = "/auth/auth-bg-abstract.svg";
const ILLUSTRATION  = "/auth/auth-illustration-login.svg";
const LOGIN_ICON    = "/auth/login.svg";
const FORGOT_ICON   = "/auth/forgot-password.svg";


function LoginPage({ onLoginSuccess, authError }) {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState("login");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (authError) {
      setError(authError);
    }
  }, [authError]);

  /* ===========================
     LOGIN HANDLER
  =========================== */
 const handleLogin = async (e) => {
  e.preventDefault();

  if (!email || !password) {
    setError("Email and password are required");
    return;
  }

  try {
    setLoading(true);
    setError("");

    const { collection, query, where, getDocs } = await import("firebase/firestore");
    const { db } = await import("../firebase");

    const q = query(
      collection(db, "users"),
      where("email", "==", email)
    );

    const snap = await getDocs(q);

    // If profile exists → check status
    if (!snap.empty) {
      const profile = snap.docs[0].data();

      if (profile.status === "Deleted") {
        setError("Account does not exist.");
        return;
      }
    }

    // Always let Firebase Auth validate credentials
    const res = await signInWithEmailAndPassword(auth, email, password);
    onLoginSuccess(res.user.uid);

  } catch (err) {
    if (err.code === "auth/user-not-found") {
      setError("Account does not exist.");
    }
    else if (err.code === "auth/wrong-password") {
      setError("Incorrect password.");
    }
    else {
      setError("Login failed. Please try again.");
    }
  } finally {
    setLoading(false);
  }
};

  /* ===========================
     RESET HANDLER
  =========================== */
  const handleReset = async (e) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await sendPasswordResetEmail(auth, email);
      setSuccess("Password reset link sent to your email.");
    } catch (err) {
      setError("Failed to send reset email. Please check the email address.");
    } finally {
      setLoading(false);
    }
  };

  /* ── "account does not exist" is the only error that gets special treatment ── */
  const isAccountMissing = error === "Account does not exist.";

  return (
    <div style={styles.page}>
      {/* Ambient background layers */}
      <div style={styles.gradientMesh} />

      {/* SVG Background elements */}
      <div style={styles.bgComposition}>
        <img src={BG_ABSTRACT}  alt="" style={styles.bgAbstract}     />
        <img src={ILLUSTRATION} alt="" style={styles.bgIllustration} key={mode} />
      </div>

      {/* Floating ambient orbs */}
      <div style={styles.orbLeft}  className="orb-drift"     />
      <div style={styles.orbRight} className="orb-drift-alt" />

      <div style={styles.container}>
        {/* Brand Header */}
        <div style={styles.brandHeader} className="brand-enter">
          <div style={styles.logoMark}>
            <div style={styles.logoInner}>WH</div>
          </div>
          <h1 style={styles.brandName}>WorkflowHub</h1>
          <p style={styles.brandTagline}>Enterprise workflow automation</p>
        </div>

        {/* ─────────────────────────────────────────────────────────
            Main card
            — adds `card-shake` + `card-account-missing` classes
              ONLY when error === "Account does not exist."
        ───────────────────────────────────────────────────────── */}
        <div
          style={styles.card}
          className={[
            "card-enter",
            isAccountMissing ? "card-shake"           : "",
            isAccountMissing ? "card-account-missing" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {/* Mode indicator */}
          <div style={styles.modeIndicator}>
            <div style={styles.iconCircle} className="icon-breathe">
              <img
                src={mode === "login" ? LOGIN_ICON : FORGOT_ICON}
                alt=""
                style={styles.modeIcon}
              />
            </div>
          </div>

          <div style={styles.cardContent}>
            <h2 style={styles.heading}>
              {mode === "login" ? "Welcome back" : "Reset your password"}
            </h2>
            <p style={styles.subheading}>
              {mode === "login"
                ? "Sign in to access your workspace"
                : "Enter your email address and we'll send you a secure reset link"}
            </p>

            <form
              onSubmit={mode === "login" ? handleLogin : handleReset}
              style={styles.form}
            >
              {/* Email field */}
              <div style={styles.fieldGroup} className="field-appear-1">
                <label style={styles.label} htmlFor="email">
                  Email address
                </label>
                <div style={styles.inputContainer}>
                  <input
                    id="email"
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError("");
                      setSuccess("");
                    }}
                    style={styles.input}
                    className="auth-input"
                    autoComplete="email"
                  />
                  <div style={styles.inputUnderline} className="input-line" />
                </div>
              </div>

              {/* Password field — login only */}
              {mode === "login" && (
                <div style={styles.fieldGroup} className="field-appear-2">
                  <label style={styles.label} htmlFor="password">
                    Password
                  </label>
                  <div style={styles.inputContainer}>
                    <input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError("");
                      }}
                      style={styles.input}
                      className="auth-input"
                      autoComplete="current-password"
                    />
                    <div style={styles.inputUnderline} className="input-line" />
                  </div>
                </div>
              )}

              {/* Error message
                  — adds `message-error-intense` class when account is missing
                    so the border gets a touch more red without changing structure */}
              {error && (
                <div
                  style={styles.messageBox}
                  className={[
                    "message-error",
                    isAccountMissing ? "message-error-intense" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <svg
                    width="20" height="20" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8"  x2="12"    y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              {/* Success message */}
              {success && (
                <div style={styles.messageBox} className="message-success">
                  <svg
                    width="20" height="20" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                  >
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  <span>{success}</span>
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                style={styles.submitButton}
                className="submit-btn"
              >
                <span style={styles.buttonText}>
                  {loading
                    ? "Please wait"
                    : mode === "login"
                      ? "Sign in"
                      : "Send reset link"}
                </span>
                {loading ? (
                  <div style={styles.loader} className="spinner" />
                ) : (
                  <svg
                    width="20" height="20" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                    style={styles.buttonArrow}
                    className="btn-arrow"
                  >
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                )}
              </button>
            </form>

            {/* Mode toggle */}
            <div style={styles.footer}>
              <button
                onClick={() => {
                  setMode(mode === "login" ? "forgot" : "login");
                  setError("");
                  setSuccess("");
                  setPassword("");
                }}
                style={styles.toggleButton}
                className="toggle-btn"
                type="button"
              >
                {mode === "login" ? "Forgot your password?" : "← Back to sign in"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Styles — unchanged from original
───────────────────────────────────────────────────────────── */
const styles = {
  page: {
    minHeight: "100vh",
    minWidth: "100vw",
    width: "100%",
    height: "100%",
    position: "fixed",
    top: 0, left: 0, right: 0, bottom: 0,
    overflow: "auto",
    background: "linear-gradient(135deg, #FFF8F0 0%, #FFF5E9 50%, #FFEFD5 100%)",
    fontFamily: "'Poppins', sans-serif",
  },

  gradientMesh: {
    position: "fixed",
    top: 0, left: 0, right: 0, bottom: 0,
    width: "100%", height: "100%",
    background: `
      radial-gradient(circle at 20% 30%, rgba(255, 154, 73, 0.12) 0%, transparent 50%),
      radial-gradient(circle at 80% 70%, rgba(255, 122, 47, 0.08) 0%, transparent 50%),
      radial-gradient(circle at 50% 50%, rgba(255, 193, 107, 0.05) 0%, transparent 60%)
    `,
    pointerEvents: "none",
  },

  bgComposition: {
    position: "fixed",
    top: 0, left: 0, right: 0, bottom: 0,
    width: "100%", height: "100%",
    overflow: "hidden",
    pointerEvents: "none",
  },

  bgAbstract: {
    position: "absolute",
    left: "-8%",
    top: "50%",
    transform: "translateY(-50%)",
    width: "clamp(400px, 42vw, 600px)",
    height: "auto",
    opacity: 0.35,
    filter: "hue-rotate(20deg) saturate(1.3) brightness(1.1)",
    mixBlendMode: "multiply",
    animation: "floatAbstract 25s ease-in-out infinite",
  },

  bgIllustration: {
    position: "absolute",
    right: "-5%",
    bottom: "8%",
    width: "clamp(350px, 38vw, 550px)",
    height: "auto",
    opacity: 0.4,
    filter: "hue-rotate(15deg) saturate(1.2) brightness(1.05)",
    mixBlendMode: "multiply",
    animation: "floatIllustration 28s ease-in-out infinite",
  },

  orbLeft: {
    position: "fixed",
    top: "15%", left: "10%",
    width: "500px", height: "500px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(255, 154, 73, 0.15) 0%, rgba(255, 154, 73, 0) 70%)",
    filter: "blur(80px)",
    pointerEvents: "none",
  },

  orbRight: {
    position: "fixed",
    bottom: "10%", right: "15%",
    width: "600px", height: "600px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(255, 122, 47, 0.12) 0%, rgba(255, 122, 47, 0) 70%)",
    filter: "blur(90px)",
    pointerEvents: "none",
  },

  container: {
    position: "relative",
    zIndex: 10,
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "80px 24px 60px",
    gap: "48px",
  },

  brandHeader: {
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "16px",
  },

  logoMark: {
    width: "64px", height: "64px",
    borderRadius: "16px",
    background: "linear-gradient(135deg, #FF9A49 0%, #FF7A2F 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 8px 32px rgba(255, 122, 47, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.4)",
    position: "relative",
  },

  logoInner: {
    fontSize: "22px",
    fontWeight: 700,
    color: "#FFFFFF",
    letterSpacing: "-0.5px",
    fontFamily: "'Poppins', sans-serif",
  },

  brandName: {
    fontSize: "26px",
    fontWeight: 600,
    color: "#2D1B0E",
    margin: 0,
    letterSpacing: "-0.5px",
    fontFamily: "'Poppins', sans-serif",
  },

  brandTagline: {
    fontSize: "13px",
    fontWeight: 400,
    color: "#8B6B4A",
    margin: 0,
    letterSpacing: "0.3px",
    fontFamily: "'Poppins', sans-serif",
  },

  card: {
    position: "relative",
    width: "min(440px, calc(100% - 32px))",
    background: "rgba(255, 255, 255, 0.85)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    borderRadius: "24px",
    border: "1px solid rgba(255, 154, 73, 0.15)",
    boxShadow: `
      0 24px 64px rgba(255, 122, 47, 0.12),
      0 8px 24px rgba(0, 0, 0, 0.04),
      inset 0 1px 0 rgba(255, 255, 255, 0.6)
    `,
    overflow: "hidden",
    /* transition lets the red glow fade in/out smoothly */
    transition: "box-shadow 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
  },

  modeIndicator: {
    padding: "36px 40px 0",
    display: "flex",
    justifyContent: "center",
  },

  iconCircle: {
    width: "80px", height: "80px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #FFF8F0 0%, #FFEFD5 100%)",
    border: "2px solid rgba(255, 154, 73, 0.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 8px 24px rgba(255, 122, 47, 0.15)",
    position: "relative",
  },

  modeIcon: {
    width: "38px", height: "38px",
  },

  cardContent: {
    padding: "28px 40px 44px",
  },

  heading: {
    fontSize: "30px",
    fontWeight: 600,
    color: "#2D1B0E",
    margin: "0 0 12px 0",
    letterSpacing: "-0.5px",
    lineHeight: 1.2,
    fontFamily: "'Poppins', sans-serif",
  },

  subheading: {
    fontSize: "14px",
    fontWeight: 400,
    color: "#8B6B4A",
    margin: "0 0 36px 0",
    lineHeight: 1.6,
    fontFamily: "'Poppins', sans-serif",
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },

  fieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },

  label: {
    fontSize: "12px",
    fontWeight: 600,
    color: "#5A4233",
    letterSpacing: "0.5px",
    textTransform: "uppercase",
    fontFamily: "'Poppins', sans-serif",
  },

  inputContainer: {
    position: "relative",
  },

  input: {
    width: "100%",
    padding: "14px 0",
    fontSize: "15px",
    fontWeight: 400,
    color: "#2D1B0E",
    background: "transparent",
    border: "none",
    borderBottom: "2px solid rgba(139, 107, 74, 0.2)",
    outline: "none",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    fontFamily: "'Poppins', sans-serif",
  },

  inputUnderline: {
    position: "absolute",
    bottom: 0, left: 0,
    width: "0%", height: "2px",
    background: "linear-gradient(90deg, #FF9A49 0%, #FF7A2F 100%)",
    transition: "width 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
  },

  messageBox: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "14px 18px",
    borderRadius: "12px",
    fontSize: "13px",
    fontWeight: 500,
    fontFamily: "'Poppins', sans-serif",
  },

  submitButton: {
    width: "100%",
    padding: "16px 32px",
    marginTop: "8px",
    background: "linear-gradient(135deg, #FF9A49 0%, #FF7A2F 100%)",
    border: "none",
    borderRadius: "14px",
    color: "#FFFFFF",
    fontSize: "15px",
    fontWeight: 600,
    fontFamily: "'Poppins', sans-serif",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    boxShadow: "0 8px 24px rgba(255, 122, 47, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.3)",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    letterSpacing: "0.3px",
    position: "relative",
    overflow: "hidden",
  },

  buttonText:  { position: "relative", zIndex: 2 },
  buttonArrow: { position: "relative", zIndex: 2 },

  loader: {
    width: "20px", height: "20px",
    border: "2.5px solid rgba(255, 255, 255, 0.3)",
    borderTopColor: "#FFFFFF",
    borderRadius: "50%",
  },

  footer: {
    marginTop: "28px",
    textAlign: "center",
  },

  toggleButton: {
    background: "none",
    border: "none",
    color: "#FF7A2F",
    fontSize: "13px",
    fontWeight: 600,
    fontFamily: "'Poppins', sans-serif",
    cursor: "pointer",
    padding: "8px 16px",
    borderRadius: "8px",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    letterSpacing: "0.2px",
  },
};

/* ─────────────────────────────────────────────────────────────
   CSS injection — original styles preserved, new rules appended
───────────────────────────────────────────────────────────── */
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.innerHTML = `
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');

    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      overflow-x: hidden;
    }

    @keyframes floatAbstract {
      0%, 100% { transform: translateY(-50%) translateX(0) rotate(0deg) scale(1); }
      25%       { transform: translateY(-48%) translateX(40px) rotate(3deg) scale(1.05); }
      50%       { transform: translateY(-52%) translateX(-30px) rotate(-2deg) scale(0.98); }
      75%       { transform: translateY(-49%) translateX(50px) rotate(4deg) scale(1.02); }
    }

    @keyframes floatIllustration {
      0%, 100% { transform: translateY(0) translateX(0) rotate(0deg) scale(1); }
      30%       { transform: translateY(-40px) translateX(-35px) rotate(-3deg) scale(1.04); }
      60%       { transform: translateY(30px) translateX(45px) rotate(2deg) scale(0.97); }
      85%       { transform: translateY(-20px) translateX(-25px) rotate(-2deg) scale(1.01); }
    }

    @keyframes orb-drift {
      0%, 100% { transform: translate(0, 0) scale(1); }
      33%       { transform: translate(60px, -50px) scale(1.15); }
      66%       { transform: translate(-40px, 60px) scale(0.95); }
    }

    @keyframes orb-drift-alt {
      0%, 100% { transform: translate(0, 0) scale(1); }
      40%       { transform: translate(-70px, 50px) scale(1.1); }
      70%       { transform: translate(50px, -40px) scale(0.92); }
    }

    @keyframes breathe {
      0%, 100% {
        transform: scale(1);
        box-shadow: 0 8px 24px rgba(255, 122, 47, 0.15);
      }
      50% {
        transform: scale(1.05);
        box-shadow: 0 12px 32px rgba(255, 122, 47, 0.25);
      }
    }

    @keyframes brand-enter {
      from { opacity: 0; transform: translateY(-20px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    @keyframes card-enter {
      from { opacity: 0; transform: translateY(30px) scale(0.96); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }

    @keyframes field-appear {
      from { opacity: 0; transform: translateY(15px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    @keyframes message-slide {
      from { opacity: 0; transform: translateY(-10px); max-height: 0; }
      to   { opacity: 1; transform: translateY(0);     max-height: 100px; }
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    @keyframes shimmer {
      0%   { transform: translateX(-100%) rotate(45deg); }
      100% { transform: translateX(200%)  rotate(45deg); }
    }

    /* ── NEW: subtle horizontal shake for "account does not exist" ── */
    @keyframes card-shake {
      0%   { transform: translateX(0); }
      15%  { transform: translateX(-6px); }
      30%  { transform: translateX(5px); }
      45%  { transform: translateX(-4px); }
      60%  { transform: translateX(3px); }
      75%  { transform: translateX(-2px); }
      90%  { transform: translateX(1px); }
      100% { transform: translateX(0); }
    }

    /* ─────────────────────────────────
       Existing animation class hooks
    ───────────────────────────────── */
    .orb-drift     { animation: orb-drift     25s ease-in-out infinite; }
    .orb-drift-alt { animation: orb-drift-alt 30s ease-in-out infinite; }
    .icon-breathe  { animation: breathe        4s ease-in-out infinite; }
    .brand-enter   { animation: brand-enter   0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.2s backwards; }
    .card-enter    { animation: card-enter    0.9s cubic-bezier(0.4, 0, 0.2, 1) 0.4s backwards; }
    .field-appear-1 { animation: field-appear 0.7s cubic-bezier(0.4, 0, 0.2, 1) 0.6s backwards; }
    .field-appear-2 { animation: field-appear 0.7s cubic-bezier(0.4, 0, 0.2, 1) 0.7s backwards; }

    /* ─────────────────────────────────
       NEW: account-missing card states
    ───────────────────────────────── */

    /* Shake fires once when the class is applied */
    .card-shake {
      animation:
        card-enter  0.9s cubic-bezier(0.4, 0, 0.2, 1) 0.4s backwards,
        card-shake  0.55s cubic-bezier(0.36, 0.07, 0.19, 0.97) forwards;
    }

    /* Persistent soft red glow while error is visible */
    .card-account-missing {
      box-shadow:
        0 24px 64px rgba(255, 122, 47, 0.12),
        0  8px 24px rgba(0,   0,   0,  0.04),
        0  0   0   1px rgba(239, 68, 68, 0.22),
        0  0  28px     rgba(239, 68, 68, 0.14),
        inset 0 1px 0 rgba(255, 255, 255, 0.6);
    }

    /* ─────────────────────────────────
       NEW: intensified error box border
       — only when paired with .message-error-intense
    ───────────────────────────────── */
    .message-error-intense {
      border-color: rgba(239, 68, 68, 0.42) !important;
      background: linear-gradient(135deg, #FFF0F0 0%, #FFE5E5) !important;
    }

    /* ─────────────────────────────────
       Existing message / input styles
    ───────────────────────────────── */
    .auth-input::placeholder {
      color: #C4A68A;
      font-style: italic;
    }

    .auth-input:focus {
      border-bottom-color: rgba(255, 122, 47, 0.4);
    }

    .auth-input:focus + .input-line {
      width: 100% !important;
    }

    .message-error {
      background: linear-gradient(135deg, #FFF5F5 0%, #FEE);
      border: 1px solid rgba(239, 68, 68, 0.2);
      color: #C53030;
      animation: message-slide 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .message-success {
      background: linear-gradient(135deg, #F0FFF4 0%, #E6FFED);
      border: 1px solid rgba(72, 187, 120, 0.2);
      color: #2F855A;
      animation: message-slide 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .submit-btn::before {
      content: '';
      position: absolute;
      top: 0; left: -100%;
      width: 50%; height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
      transition: left 0.6s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .submit-btn:hover::before { left: 150%; }

    .submit-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 12px 32px rgba(255, 122, 47, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.4);
    }
    .submit-btn:active:not(:disabled) { transform: translateY(0); }
    .submit-btn:disabled { opacity: 0.7; cursor: not-allowed; }

    .btn-arrow { transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
    .submit-btn:hover:not(:disabled) .btn-arrow { transform: translateX(4px); }

    .spinner { animation: spin 0.7s linear infinite; }

    .toggle-btn { position: relative; }
    .toggle-btn::after {
      content: '';
      position: absolute;
      bottom: 0; left: 50%;
      transform: translateX(-50%);
      width: 0; height: 2px;
      background: linear-gradient(90deg, #FF9A49 0%, #FF7A2F 100%);
      transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .toggle-btn:hover::after { width: 100%; }
    .toggle-btn:hover {
      background: rgba(255, 154, 73, 0.08);
      color: #E65C00;
    }

    * { box-sizing: border-box; }

    @media (max-width: 640px) {
      .brand-enter { padding: 0 16px; }
    }
  `;
  document.head.appendChild(style);
}

export default LoginPage;