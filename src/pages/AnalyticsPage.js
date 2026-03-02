import { useEffect, useMemo, useState, useRef } from "react";
import { auth } from "../firebase";
import {
  getTasksByOrganization,
  getTasksByEmployee,
  getEmployeesByOrganization,
} from "../services/taskService";
import { getAllOrganizations } from "../services/organizationService";

/* ─────────────────────────────────────────────────────────────
   Global styles — identical class prefix to EmployeeInsightsPage
───────────────────────────────────────────────────────────── */
if (typeof document !== "undefined" && !document.getElementById("ap-styles")) {
  const s = document.createElement("style");
  s.id = "ap-styles";
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
    *, *::before, *::after { box-sizing: border-box; }

    @keyframes ap-rise {
      from { opacity: 0; transform: translateY(18px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes ap-spin  { to { transform: rotate(360deg); } }
    @keyframes ap-pulse {
      0%, 100% { opacity: 1; }
      50%       { opacity: 0.5; }
    }
    @keyframes ap-line-draw {
      from { stroke-dashoffset: 800; }
      to   { stroke-dashoffset: 0; }
    }

    .ap-rise { animation: ap-rise 0.55s cubic-bezier(0.22,1,0.36,1) both; }

    .ap-spinner {
      width: 36px; height: 36px;
      border: 3px solid rgba(214,119,0,0.15);
      border-top-color: #D67700;
      border-radius: 50%;
      animation: ap-spin 0.75s linear infinite;
    }

    /* cards */
    .ap-card {
      transition: transform 0.25s cubic-bezier(0.22,1,0.36,1), box-shadow 0.25s ease;
    }
    .ap-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 40px rgba(214,119,0,0.10), 0 4px 16px rgba(0,0,0,0.05) !important;
    }

    /* stat cards */
    .ap-stat {
      transition: transform 0.2s cubic-bezier(0.22,1,0.36,1), box-shadow 0.2s ease;
    }
    .ap-stat:hover {
      transform: translateY(-3px);
      box-shadow: 0 10px 32px rgba(214,119,0,0.14) !important;
    }

    .ap-select {
      appearance: none; -webkit-appearance: none; cursor: pointer;
      transition: border-color 0.18s, box-shadow 0.18s;
    }
    .ap-select:focus {
      outline: none;
      border-color: #D67700 !important;
      box-shadow: 0 0 0 3px rgba(214,119,0,0.12) !important;
    }

    .ap-bar { transition: width 1s cubic-bezier(0.22,1,0.36,1); }

    .ap-line-1 {
      stroke-dasharray: 800;
      animation: ap-line-draw 1.1s cubic-bezier(0.22,1,0.36,1) 0.3s both;
    }
    .ap-line-2 {
      stroke-dasharray: 800;
      animation: ap-line-draw 1.1s cubic-bezier(0.22,1,0.36,1) 0.45s both;
    }

    .ap-tr:hover > td { background: rgba(214,119,0,0.03); }
    .ap-emp:hover { background: rgba(214,119,0,0.04) !important; }
  `;
  document.head.appendChild(s);
}

/* ─────────────────────────────────────────────────────────────
   Design tokens — identical to EmployeeInsightsPage
───────────────────────────────────────────────────────────── */
const T = {
  pageBg:      "#FAF6EE",
  cardBg:      "#FFFFFF",
  cardWarm:    "#FFFDF8",
  amber:       "#D67700",
  amberMid:    "#E08A00",
  amberLight:  "#F5A623",
  amberBtn:    "linear-gradient(135deg, #E08A00 0%, #C46F00 100%)",
  amberPale:   "rgba(214,119,0,0.08)",
  amberPaler:  "rgba(214,119,0,0.05)",
  amberBorder: "rgba(214,119,0,0.20)",
  amberGlow:   "rgba(214,119,0,0.15)",
  amberHeader: "linear-gradient(135deg, #FFF8E8 0%, #FFF1CC 60%, #FFFDF8 100%)",
  green:       "#16A34A",
  greenPale:   "rgba(22,163,74,0.08)",
  greenBorder: "rgba(22,163,74,0.20)",
  red:         "#DC2626",
  redPale:     "rgba(220,38,38,0.07)",
  redBorder:   "rgba(220,38,38,0.18)",
  blue:        "#2563EB",
  bluePale:    "rgba(37,99,235,0.08)",
  blueBorder:  "rgba(37,99,235,0.18)",
  textPrimary:   "#1C1917",
  textSecondary: "#57534E",
  textMuted:     "#A8A29E",
  border:      "#E7E0D5",
  borderLight: "#F0EBE3",
};

/* ─────────────────────────────────────────────────────────────
   Pure helpers — LOGIC UNCHANGED
───────────────────────────────────────────────────────────── */
const toDate = (d) =>
  typeof d?.toDate === "function" ? d.toDate() : d ? new Date(d) : null;
const now = () => new Date();
const isWithin7Days = (dateField) => {
  if (!dateField) return false;
  const d = toDate(dateField);
  return d && d >= new Date(now() - 7 * 86400000);
};
const isOverdue = (task) => {
  if (!task.deadline || task.status === "Done") return false;
  const d = toDate(task.deadline);
  return d && d < now();
};
const ageInDays = (task) => {
  const d = toDate(task.createdAt);
  return d ? (now() - d) / 86400000 : 0;
};
const avgCompletionTime = (tasks) => {
  const done = tasks.filter((t) => t.status === "Done" && t.createdAt && t.completedAt);
  if (!done.length) return null;
  const avg = done.reduce((s, t) => s + (toDate(t.completedAt) - toDate(t.createdAt)), 0) / done.length;
  const h = avg / 3600000;
  return h < 24 ? `${Math.round(h)}h` : `${(h / 24).toFixed(1)}d`;
};
const buildDailySeries = (tasks) =>
  Array.from({ length: 7 }, (_, i) => {
    const d        = new Date(now() - (6 - i) * 86400000);
    const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const dayEnd   = new Date(dayStart.getTime() + 86400000);
    return {
      label:     d.toLocaleDateString("en-US", { weekday: "short" }),
      created:   tasks.filter((t) => { const c = toDate(t.createdAt);   return c && c >= dayStart && c < dayEnd; }).length,
      completed: tasks.filter((t) => { const c = toDate(t.completedAt); return c && c >= dayStart && c < dayEnd && t.status === "Done"; }).length,
    };
  });

/* ─────────────────────────────────────────────────────────────
   Animated counter
───────────────────────────────────────────────────────────── */
function useCounter(target, dur = 900) {
  const [v, setV] = useState(0);
  const raf = useRef(null);
  useEffect(() => {
    const t0 = performance.now();
    const tick = (t) => {
      const p = Math.min((t - t0) / dur, 1);
      setV(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, dur]);
  return v;
}

/* ─────────────────────────────────────────────────────────────
   Shared primitives — match EmployeeInsightsPage exactly
───────────────────────────────────────────────────────────── */
const SectionTag = ({ children, color = T.amber }) => (
  <span style={{
    fontFamily: "Poppins, sans-serif",
    fontSize: 10, fontWeight: 700,
    letterSpacing: "0.14em", textTransform: "uppercase", color,
  }}>
    {children}
  </span>
);

function Card({ children, style = {}, className = "" }) {
  return (
    <div className={`ap-card ${className}`} style={{
      background: T.cardBg,
      border: `1px solid ${T.border}`,
      borderRadius: 20,
      boxShadow: "0 2px 16px rgba(0,0,0,0.04), 0 1px 4px rgba(0,0,0,0.03)",
      overflow: "hidden",
      ...style,
    }}>
      {children}
    </div>
  );
}

/* CardHeader — amber gradient top strip with optional SVG icon, matching EI */
function CardHeader({ tag, title, IconComp, right }) {
  return (
    <div style={{
      padding: "18px 24px 14px",
      borderBottom: `1px solid ${T.borderLight}`,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      background: T.amberHeader,
    }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <SectionTag>{tag}</SectionTag>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {IconComp && <IconComp size={16} color={T.amber} />}
          <h3 style={{
            fontFamily: "Poppins, sans-serif",
            fontSize: 15, fontWeight: 600,
            color: T.textPrimary, margin: 0, letterSpacing: "-0.2px",
          }}>
            {title}
          </h3>
        </div>
      </div>
      {right}
    </div>
  );
}

function Empty({ msg = "No data for this window" }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      minHeight: 140, flexDirection: "column", gap: 10,
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: "50%",
        background: T.amberPale, border: `1px solid ${T.amberBorder}`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon.Empty size={20} color={T.amber} />
      </div>
      <span style={{ fontFamily: "Poppins, sans-serif", fontSize: 12.5, color: T.textMuted, fontWeight: 500 }}>
        {msg}
      </span>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Premium SVG icon set — 20×20 stroke, consistent weight
───────────────────────────────────────────────────────────── */
const Icon = {
  Tasks: ({ size = 20, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 2H7a2 2 0 00-2 2v16a2 2 0 002 2h10a2 2 0 002-2V4a2 2 0 00-2-2h-2"/>
      <rect x="9" y="2" width="6" height="4" rx="1"/>
      <path d="M9 12h6M9 16h4"/>
    </svg>
  ),
  Complete: ({ size = 20, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M8 12l3 3 5-6"/>
    </svg>
  ),
  InProgress: ({ size = 20, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 22h14M5 2h14"/>
      <path d="M17 22v-4.172a2 2 0 00-.586-1.414L12 12l-4.414 4.414A2 2 0 007 17.828V22"/>
      <path d="M7 2v4.172a2 2 0 00.586 1.414L12 12l4.414-4.414A2 2 0 0017 6.172V2"/>
    </svg>
  ),
  Overdue: ({ size = 20, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  ),
  Rate: ({ size = 20, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <circle cx="12" cy="12" r="6"/>
      <circle cx="12" cy="12" r="2"/>
    </svg>
  ),
  Distribution: ({ size = 20, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.21 15.89A10 10 0 118 2.83"/>
      <path d="M22 12A10 10 0 0012 2v10z"/>
    </svg>
  ),
  Trend: ({ size = 20, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
      <polyline points="16 7 22 7 22 13"/>
    </svg>
  ),
  Urgency: ({ size = 20, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="13" r="8"/>
      <path d="M12 9v4l2.5 2.5"/>
      <path d="M9.5 2.5h5M12 2.5v1.8"/>
    </svg>
  ),
  Team: ({ size = 20, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
    </svg>
  ),
  Org: ({ size = 20, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2"/>
      <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/>
    </svg>
  ),
  Timer: ({ size = 20, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="13" r="8"/>
      <path d="M12 9v4l2.5 2.5"/>
      <path d="M9.5 2.5h5M12 2.5v1.8"/>
    </svg>
  ),
  Empty: ({ size = 20, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="8" y1="12" x2="16" y2="12"/>
    </svg>
  ),
};

/* ─────────────────────────────────────────────────────────────
   Stat card — full SVG icon, color-accented, matching EI style
───────────────────────────────────────────────────────────── */
function StatCard({ label, value, sub, IconComp, accentColor, accentPale, accentBorder, delay }) {
  const animated = useCounter(value);
  return (
    <div className="ap-stat ap-rise" style={{
      background: "linear-gradient(145deg, #FFFDF5 0%, #FFF8E1 100%)",
      border: `1px solid ${accentBorder}`,
      borderRadius: 20,
      padding: "22px 24px",
      boxShadow: "0 2px 16px rgba(214,119,0,0.06)",
      animationDelay: delay,
      position: "relative",
      overflow: "hidden",
    }}>
      {/* background glow */}
      <div style={{
        position: "absolute", top: -24, right: -24,
        width: 90, height: 90, borderRadius: "50%",
        background: `radial-gradient(circle, ${accentPale} 0%, transparent 70%)`,
        pointerEvents: "none",
      }} />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <SectionTag color={T.textMuted}>{label}</SectionTag>
        <div style={{
          width: 38, height: 38, borderRadius: 10,
          background: accentPale, border: `1px solid ${accentBorder}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <IconComp size={18} color={accentColor} />
        </div>
      </div>

      <div style={{
        fontFamily: "Poppins, sans-serif",
        fontSize: 42, fontWeight: 700,
        color: T.textPrimary, letterSpacing: "-1.5px",
        lineHeight: 1, marginBottom: 8,
      }}>
        {animated}
      </div>

      {sub && (
        <p style={{ fontFamily: "Poppins, sans-serif", fontSize: 12, color: T.textMuted, margin: 0, fontWeight: 400 }}>
          {sub}
        </p>
      )}

      {/* accent bottom bar */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: 3,
        background: `linear-gradient(90deg, ${accentColor}, transparent)`,
        opacity: 0.5,
      }} />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   270° arc completion gauge — identical to EI
───────────────────────────────────────────────────────────── */
function RateGauge({ rate }) {
  const clamped = Math.min(Math.max(rate, 0), 100);
  const R = 68; const sw = 10;
  const circ = 2 * Math.PI * R;
  const track = circ * 0.75;
  const fill  = track * (clamped / 100);
  const color = rate >= 70 ? T.green : rate >= 40 ? T.amber : T.red;
  const label = rate >= 70 ? "On Track" : rate >= 40 ? "Moderate" : "Needs Attention";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "16px 0 8px" }}>
      <div style={{ position: "relative", width: 168, height: 168 }}>
        <svg width="168" height="168" viewBox="0 0 168 168">
          <circle cx="84" cy="84" r={R} fill="none" stroke={T.borderLight}
            strokeWidth={sw} strokeLinecap="round"
            strokeDasharray={`${track} ${circ}`} transform="rotate(135 84 84)" />
          <circle cx="84" cy="84" r={R} fill="none" stroke={color}
            strokeWidth={sw} strokeLinecap="round"
            strokeDasharray={`${fill} ${circ}`} transform="rotate(135 84 84)"
            style={{ transition: "stroke-dasharray 1s cubic-bezier(0.22,1,0.36,1), stroke 0.3s" }} />
        </svg>
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        }}>
          <span style={{
            fontFamily: "Poppins, sans-serif",
            fontSize: 36, fontWeight: 700, color: T.textPrimary,
            lineHeight: 1, letterSpacing: "-1px",
          }}>
            {Math.round(rate)}%
          </span>
          <span style={{
            fontFamily: "Poppins, sans-serif",
            fontSize: 10.5, fontWeight: 600, color,
            marginTop: 6, letterSpacing: "0.08em", textTransform: "uppercase",
          }}>
            {label}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Donut — identical to EI
───────────────────────────────────────────────────────────── */
function Donut({ segments, total }) {
  const R = 62; const sw = 11;
  const circ = 2 * Math.PI * R;
  let offset = 0;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
      <div style={{ position: "relative", flexShrink: 0, width: 152, height: 152 }}>
        <svg width="152" height="152" viewBox="0 0 152 152">
          <circle cx="76" cy="76" r={R} fill="none" stroke={T.borderLight} strokeWidth={sw} />
          {total > 0 && segments.map((seg, i) => {
            const len = circ * (seg.value / total);
            const off = offset; offset += len;
            return (
              <circle key={i} cx="76" cy="76" r={R}
                fill="none" stroke={seg.color} strokeWidth={sw}
                strokeDasharray={`${len} ${circ}`} strokeDashoffset={-off}
                strokeLinecap="round"
                style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%", transition: "stroke-dasharray 0.8s cubic-bezier(0.22,1,0.36,1)" }}
              />
            );
          })}
        </svg>
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        }}>
          <span style={{ fontFamily: "Poppins, sans-serif", fontSize: 30, fontWeight: 700, color: T.textPrimary, letterSpacing: "-1px", lineHeight: 1 }}>
            {total}
          </span>
          <span style={{ fontFamily: "Poppins, sans-serif", fontSize: 9.5, fontWeight: 600, color: T.textMuted, letterSpacing: "0.12em", textTransform: "uppercase", marginTop: 3 }}>
            total
          </span>
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
        {segments.map((seg, i) => (
          <div key={i}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: seg.color }} />
                <span style={{ fontFamily: "Poppins, sans-serif", fontSize: 12.5, fontWeight: 500, color: T.textSecondary }}>
                  {seg.label}
                </span>
              </div>
              <span style={{ fontFamily: "Poppins, sans-serif", fontSize: 14, fontWeight: 700, color: T.textPrimary }}>
                {seg.value}
              </span>
            </div>
            <div style={{ height: 4, background: T.borderLight, borderRadius: 4, overflow: "hidden" }}>
              <div className="ap-bar" style={{
                height: "100%", width: `${total > 0 ? (seg.value / total) * 100 : 0}%`,
                background: seg.color, borderRadius: 4,
              }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Daily sparkline — upgraded with premium styling
───────────────────────────────────────────────────────────── */
function DailyChart({ data }) {
  if (!data || data.every((d) => d.created === 0 && d.completed === 0)) return <Empty />;
  const W = 100; const H = 80;
  const max = Math.max(...data.map((d) => Math.max(d.created, d.completed)), 1);
  const toY = (v) => H - (v / max) * (H - 8) + 4;
  const toX = (i) => (i / (data.length - 1)) * W;
  const pts1 = data.map((d, i) => `${toX(i)},${toY(d.created)}`).join(" ");
  const pts2 = data.map((d, i) => `${toX(i)},${toY(d.completed)}`).join(" ");

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none"
        style={{ width: "100%", height: 130, display: "block", overflow: "visible" }}>
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <line key={f} x1="0" y1={toY(max * f)} x2={W} y2={toY(max * f)}
            stroke={T.borderLight} strokeWidth="0.6" />
        ))}
        <polyline points={`0,${H} ${pts1} ${W},${H}`} fill={`${T.amber}14`} stroke="none" />
        <polyline points={`0,${H} ${pts2} ${W},${H}`} fill={`${T.green}10`} stroke="none" />
        <polyline points={pts1} fill="none" stroke={T.amber} strokeWidth="2"
          strokeLinejoin="round" strokeLinecap="round" className="ap-line-1" />
        <polyline points={pts2} fill="none" stroke={T.green} strokeWidth="2"
          strokeLinejoin="round" strokeLinecap="round" className="ap-line-2" />
        {data.map((d, i) => (
          <g key={i}>
            <circle cx={toX(i)} cy={toY(d.created)}   r="2.8" fill="#fff" stroke={T.amber} strokeWidth="1.8" />
            <circle cx={toX(i)} cy={toY(d.completed)} r="2.8" fill="#fff" stroke={T.green} strokeWidth="1.8" />
          </g>
        ))}
      </svg>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
        {data.map((d, i) => (
          <span key={i} style={{ fontFamily: "Poppins, sans-serif", fontSize: 9.5, color: T.textMuted, fontWeight: 500 }}>
            {d.label}
          </span>
        ))}
      </div>

      <div style={{ display: "flex", gap: 20, marginTop: 16, paddingTop: 12, borderTop: `1px solid ${T.borderLight}` }}>
        {[{ c: T.amber, label: "Created" }, { c: T.green, label: "Completed" }].map((l) => (
          <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <div style={{ width: 16, height: 3, background: l.c, borderRadius: 2 }} />
            <span style={{ fontFamily: "Poppins, sans-serif", fontSize: 11.5, color: T.textMuted, fontWeight: 500 }}>
              {l.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Task aging — premium color-coded rows
───────────────────────────────────────────────────────────── */
function AgingBars({ buckets }) {
  const max = Math.max(...buckets.map((b) => b.count), 1);
  const rows = [
    { ...buckets[0], color: T.green, pale: T.greenPale, border: T.greenBorder, badge: "Fresh" },
    { ...buckets[1], color: T.amber, pale: T.amberPale, border: T.amberBorder, badge: "Aging" },
    { ...buckets[2], color: T.red,   pale: T.redPale,   border: T.redBorder,   badge: "Critical" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {rows.map((b, i) => (
        <div key={i} style={{
          display: "flex", alignItems: "center", gap: 16,
          padding: "16px 0",
          borderBottom: i < rows.length - 1 ? `1px solid ${T.borderLight}` : "none",
        }}>
          {/* count box */}
          <div style={{
            width: 44, height: 44, borderRadius: 11, flexShrink: 0,
            background: b.pale, border: `1px solid ${b.border}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "Poppins, sans-serif",
            fontSize: 16, fontWeight: 700, color: b.color,
          }}>
            {b.count}
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontFamily: "Poppins, sans-serif", fontSize: 12.5, fontWeight: 500, color: T.textSecondary }}>
                  {b.label}
                </span>
                {/* status badge */}
                <span style={{
                  fontFamily: "Poppins, sans-serif",
                  fontSize: 9.5, fontWeight: 700,
                  color: b.color, background: b.pale,
                  padding: "2px 8px", borderRadius: 20,
                  border: `1px solid ${b.border}`,
                  letterSpacing: "0.06em", textTransform: "uppercase",
                }}>
                  {b.badge}
                </span>
              </div>
            </div>
            <div style={{ height: 6, background: T.borderLight, borderRadius: 6, overflow: "hidden" }}>
              <div className="ap-bar" style={{
                height: "100%", width: `${(b.count / max) * 100}%`,
                background: b.color, borderRadius: 6,
              }} />
            </div>
          </div>
        </div>
      ))}
      <p style={{
        fontFamily: "Poppins, sans-serif",
        fontSize: 11, color: T.textMuted,
        marginTop: 14, lineHeight: 1.6, fontStyle: "italic",
      }}>
        Tasks auto-delete after 7 days. Act on critical items promptly.
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Employee rank list — premium with color-accented top performer
───────────────────────────────────────────────────────────── */
function EmployeeList({ employees }) {
  if (!employees || employees.length === 0) return <Empty msg="No employee activity this week" />;
  const top = employees[0]?.completionRate || 1;

  return (
    <div>
      {employees.map((emp, i) => (
        <div key={i} className="ap-emp" style={{
          display: "flex", alignItems: "center", gap: 14,
          padding: "14px 24px",
          borderBottom: i < employees.length - 1 ? `1px solid ${T.borderLight}` : "none",
          transition: "background 0.18s",
        }}>
          {/* rank badge */}
          <div style={{
            width: 34, height: 34, borderRadius: 10, flexShrink: 0,
            background: i === 0
              ? "linear-gradient(135deg, #E08A00 0%, #C46F00 100%)"
              : T.borderLight,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "Poppins, sans-serif",
            fontSize: 13, fontWeight: 700,
            color: i === 0 ? "#fff" : T.textMuted,
            boxShadow: i === 0 ? "0 2px 8px rgba(214,119,0,0.25)" : "none",
          }}>
            {i + 1}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{
                fontFamily: "Poppins, sans-serif", fontSize: 13, fontWeight: 600,
                color: T.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {emp.name}
              </span>
              <span style={{ fontFamily: "Poppins, sans-serif", fontSize: 11.5, color: T.textMuted, fontWeight: 500, flexShrink: 0, marginLeft: 8 }}>
                {emp.completed}/{emp.total}
              </span>
            </div>
            <div style={{ height: 5, background: T.borderLight, borderRadius: 5, overflow: "hidden" }}>
              <div className="ap-bar" style={{
                height: "100%", width: `${(emp.completionRate / top) * 100}%`,
                background: i === 0 ? `linear-gradient(90deg, ${T.amberMid}, #C46F00)` : T.green,
                borderRadius: 5,
              }} />
            </div>
          </div>

          {/* rate chip — color-accented */}
          <span style={{
            fontFamily: "Poppins, sans-serif",
            fontSize: 12.5, fontWeight: 700,
            color: emp.completionRate >= 70 ? T.green : emp.completionRate >= 40 ? T.amber : T.red,
            background: emp.completionRate >= 70 ? T.greenPale : emp.completionRate >= 40 ? T.amberPale : T.redPale,
            border: `1px solid ${emp.completionRate >= 70 ? T.greenBorder : emp.completionRate >= 40 ? T.amberBorder : T.redBorder}`,
            padding: "3px 12px", borderRadius: 20,
            minWidth: 54, textAlign: "center", flexShrink: 0,
          }}>
            {emp.completionRate}%
          </span>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Org benchmark table — premium with color-coded rate chips
───────────────────────────────────────────────────────────── */
function OrgTable({ orgs }) {
  if (!orgs || orgs.length === 0) return <Empty msg="No organization data" />;
  const rateColor  = (r) => r >= 70 ? T.green : r >= 40 ? T.amber : T.red;
  const ratePale   = (r) => r >= 70 ? T.greenPale : r >= 40 ? T.amberPale : T.redPale;
  const rateBorder = (r) => r >= 70 ? T.greenBorder : r >= 40 ? T.amberBorder : T.redBorder;

  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr style={{ background: T.amberHeader }}>
          {["Organization", "Created", "Completed", "Overdue", "Rate"].map((h, idx) => (
            <th key={h} style={{
              padding: "12px 20px",
              textAlign: idx === 0 ? "left" : "center",
              fontFamily: "Poppins, sans-serif",
              fontSize: 10, fontWeight: 700,
              letterSpacing: "0.12em", textTransform: "uppercase",
              color: T.textMuted,
              borderBottom: `1px solid ${T.border}`,
            }}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {orgs.map((org, i) => (
          <tr key={i} className="ap-tr">
            <td style={{ padding: "15px 20px", fontFamily: "Poppins, sans-serif", fontSize: 13.5, fontWeight: 600, color: T.textPrimary, borderBottom: `1px solid ${T.borderLight}` }}>
              {org.name}
            </td>
            <td style={{ padding: "15px 20px", textAlign: "center", fontFamily: "Poppins, sans-serif", fontSize: 14, fontWeight: 600, color: T.textSecondary, borderBottom: `1px solid ${T.borderLight}` }}>
              {org.total}
            </td>
            {/* Completed — green accent */}
            <td style={{ padding: "15px 20px", textAlign: "center", borderBottom: `1px solid ${T.borderLight}` }}>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                fontFamily: "Poppins, sans-serif", fontSize: 13.5, fontWeight: 700, color: T.green,
                background: T.greenPale, padding: "3px 12px", borderRadius: 20,
                border: `1px solid ${T.greenBorder}`,
              }}>
                {org.completed}
              </span>
            </td>
            {/* Overdue — red accent if > 0 */}
            <td style={{ padding: "15px 20px", textAlign: "center", borderBottom: `1px solid ${T.borderLight}` }}>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                fontFamily: "Poppins, sans-serif", fontSize: 13.5, fontWeight: 700,
                color: org.overdue > 0 ? T.red : T.textMuted,
                background: org.overdue > 0 ? T.redPale : "transparent",
                padding: "3px 12px", borderRadius: 20,
                border: org.overdue > 0 ? `1px solid ${T.redBorder}` : "1px solid transparent",
              }}>
                {org.overdue}
              </span>
            </td>
            <td style={{ padding: "15px 20px", textAlign: "center", borderBottom: `1px solid ${T.borderLight}` }}>
              <span style={{
                display: "inline-block",
                fontFamily: "Poppins, sans-serif", fontSize: 12.5, fontWeight: 700,
                color: rateColor(org.rate),
                background: ratePale(org.rate),
                padding: "4px 14px", borderRadius: 20,
                border: `1px solid ${rateBorder(org.rate)}`,
              }}>
                {org.rate}%
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* ─────────────────────────────────────────────────────────────
   AnalyticsPage — LOGIC UNCHANGED, layout upgraded
───────────────────────────────────────────────────────────── */
function AnalyticsPage({ role, organizationId, currentUser }) {
  const [tasks,         setTasks]         = useState([]);
  const [employees,     setEmployees]     = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [selectedOrgId, setSelectedOrgId] = useState("all");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        if (role === "super_admin") {
          const orgs = await getAllOrganizations();
          setOrganizations(orgs || []);
          let allTasks = [], allEmps = [];
          for (const org of orgs) {
            const t = await getTasksByOrganization(org.id);
            const e = await getEmployeesByOrganization(org.id);
            allTasks = allTasks.concat((t || []).map((x) => ({ ...x, orgId: org.id, orgName: org.name })));
            allEmps  = allEmps.concat(e || []);
          }
          setTasks(allTasks); setEmployees(allEmps);
        } else if (role === "admin" && organizationId) {
          const [t, e] = await Promise.all([
            getTasksByOrganization(organizationId),
            getEmployeesByOrganization(organizationId),
          ]);
          setTasks(t || []); setEmployees(e || []);
        } else if (role === "employee" && auth.currentUser) {
          const t = await getTasksByEmployee(auth.currentUser.uid);
          setTasks(t || []);
        }
      } catch (err) { console.error(err); }
      setLoading(false);
    };
    load();
  }, [role, organizationId]);

  const filteredTasks = useMemo(() => {
    let base = tasks.filter((t) => isWithin7Days(t.createdAt));
    if (role === "super_admin" && selectedOrgId !== "all")
      base = base.filter((t) => t.orgId === selectedOrgId);
    return base;
  }, [tasks, selectedOrgId, role]);

  const metrics = useMemo(() => {
    const total     = filteredTasks.length;
    const completed = filteredTasks.filter((t) => t.status === "Done").length;
    const pending   = filteredTasks.filter((t) => t.status !== "Done").length;
    const overdue   = filteredTasks.filter((t) => isOverdue(t)).length;
    return { total, completed, pending, overdue,
      rate: total > 0 ? Math.round((completed / total) * 100) : 0,
      avgTime: avgCompletionTime(filteredTasks),
    };
  }, [filteredTasks]);

  const dailySeries  = useMemo(() => buildDailySeries(filteredTasks), [filteredTasks]);

  const agingBuckets = useMemo(() => {
    const active = filteredTasks.filter((t) => t.status !== "Done");
    return [
      { label: "Fresh — 0 to 2 days",    count: active.filter((t) => ageInDays(t) <= 2).length },
      { label: "Aging — 3 to 5 days",    count: active.filter((t) => ageInDays(t) > 2 && ageInDays(t) <= 5).length },
      { label: "Critical — 6 to 7 days", count: active.filter((t) => ageInDays(t) > 5).length },
    ];
  }, [filteredTasks]);

  const orgData = useMemo(() => {
    if (role !== "super_admin") return [];
    const map = {};
    tasks.filter((t) => isWithin7Days(t.createdAt)).forEach((t) => {
      const name = t.orgName || "Unknown";
      if (!map[name]) map[name] = { name, total: 0, completed: 0, overdue: 0 };
      map[name].total++;
      if (t.status === "Done") map[name].completed++;
      if (isOverdue(t))        map[name].overdue++;
    });
    return Object.values(map)
      .map((o) => ({ ...o, rate: o.total > 0 ? Math.round((o.completed / o.total) * 100) : 0 }))
      .sort((a, b) => b.rate - a.rate);
  }, [tasks, role]);

  const employeeStats = useMemo(() => {
    if (role === "employee") return [];
    return employees
      .map((e) => {
        const mine      = filteredTasks.filter((t) => t.assignedTo === e.uid);
        const completed = mine.filter((t) => t.status === "Done").length;
        const total     = mine.length;
        return { name: e.name || e.email || "Unknown", total, completed, completionRate: total > 0 ? Math.round((completed / total) * 100) : 0 };
      })
      .filter((e) => e.total > 0)
      .sort((a, b) => b.completionRate - a.completionRate)
      .slice(0, 8);
  }, [employees, filteredTasks, role]);

  const displayName = currentUser?.name || currentUser?.email || "User";

  /* ── Loading ── */
  if (loading) {
    return (
      <div style={{
        minHeight: "60vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 16,
        fontFamily: "Poppins, sans-serif",
      }}>
        <div className="ap-spinner" />
        <span style={{ fontSize: 13, color: T.textMuted, fontWeight: 500 }}>Loading analytics…</span>
      </div>
    );
  }

  return (
    /* Transparent — Layout provides #FAF6EE background and 36px 40px padding */
    <div style={{
      fontFamily: "Poppins, sans-serif",
      maxWidth: 1320, margin: "0 auto",
      paddingBottom: 56,
    }}>

      {/* ════════ HEADER ════════ */}
      <div className="ap-rise" style={{
        paddingBottom: 24, marginBottom: 24,
        borderBottom: `1px solid ${T.border}`,
        display: "flex", alignItems: "flex-end",
        justifyContent: "space-between", flexWrap: "wrap", gap: 16,
      }}>
        <div>
          {/* rolling window pill */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: T.amberPale, border: `1px solid ${T.amberBorder}`,
            borderRadius: 20, padding: "5px 16px", marginBottom: 14,
          }}>
            <div style={{
              width: 7, height: 7, borderRadius: "50%", background: T.amber,
              animation: "ap-pulse 2s ease-in-out infinite",
            }} />
            <span style={{
              fontFamily: "Poppins, sans-serif",
              fontSize: 11, fontWeight: 700, color: T.amber, letterSpacing: "0.06em",
            }}>
              Rolling 7-day window
            </span>
          </div>

          <h1 style={{
            fontFamily: "Poppins, sans-serif",
            fontSize: 32, fontWeight: 700, color: T.textPrimary,
            margin: 0, letterSpacing: "-0.8px", lineHeight: 1.1,
          }}>
            Analytics
          </h1>
          <p style={{
            fontFamily: "Poppins, sans-serif",
            fontSize: 14, color: T.textSecondary, margin: "6px 0 0", fontWeight: 400,
          }}>
            Welcome back,{" "}
            <span style={{ fontWeight: 600, color: T.textPrimary }}>{displayName}</span>
          </p>
        </div>

        {/* Org selector */}
        {role === "super_admin" && organizations.length > 0 && (
          <div style={{ position: "relative" }}>
            <select
              value={selectedOrgId}
              onChange={(e) => setSelectedOrgId(e.target.value)}
              className="ap-select"
              style={{
                fontFamily: "Poppins, sans-serif",
                fontSize: 13, fontWeight: 500, color: T.textPrimary,
                padding: "10px 40px 10px 16px",
                borderRadius: 12, border: `1px solid ${T.border}`,
                background: "#fff", minWidth: 220,
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              }}
            >
              <option value="all">All Organizations</option>
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>{org.name}</option>
              ))}
            </select>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke={T.textMuted} strokeWidth="2.2" strokeLinecap="round"
              style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
              <path d="M6 9l6 6 6-6" />
            </svg>
          </div>
        )}
      </div>

      {/* ════════ STAT STRIP — SVG icons, color-accented borders ════════ */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: 16, marginBottom: 20,
      }}>
        <StatCard
          label="Created"     value={metrics.total}
          IconComp={Icon.Tasks}
          accentColor={T.blue}  accentPale={T.bluePale}  accentBorder={T.blueBorder}
          sub="Tasks this week"  delay="0.06s"
        />
        <StatCard
          label="Completed"   value={metrics.completed}
          IconComp={Icon.Complete}
          accentColor={T.green} accentPale={T.greenPale} accentBorder={T.greenBorder}
          sub={metrics.avgTime ? `Avg. ${metrics.avgTime}` : "This week"} delay="0.10s"
        />
        <StatCard
          label="In Progress" value={metrics.pending}
          IconComp={Icon.InProgress}
          accentColor={T.amber} accentPale={T.amberPale} accentBorder={T.amberBorder}
          sub="Active tasks"  delay="0.14s"
        />
        <StatCard
          label="Overdue"     value={metrics.overdue}
          IconComp={Icon.Overdue}
          accentColor={T.red}   accentPale={T.redPale}   accentBorder={T.redBorder}
          sub="Need attention" delay="0.18s"
        />
      </div>

      {/* ════════ ROW 1: Gauge · Donut · Sparkline ════════ */}
      <div style={{ display: "grid", gridTemplateColumns: "220px 1fr 1.5fr", gap: 16, marginBottom: 16 }}>

        <Card className="ap-rise" style={{ animationDelay: "0.14s" }}>
          <CardHeader tag="Performance" title="Completion Rate" IconComp={Icon.Rate} />
          <div style={{ padding: "8px 16px 20px" }}>
            {metrics.total > 0 ? <RateGauge rate={metrics.rate} /> : <Empty />}
          </div>
        </Card>

        <Card className="ap-rise" style={{ animationDelay: "0.18s" }}>
          <CardHeader
            tag="Breakdown" title="Task Distribution" IconComp={Icon.Distribution}
            right={
              <span style={{
                fontFamily: "Poppins, sans-serif",
                fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
                color: T.amber, background: T.amberPale,
                padding: "3px 12px", borderRadius: 20, border: `1px solid ${T.amberBorder}`,
              }}>
                7 days
              </span>
            }
          />
          <div style={{ padding: "20px 24px" }}>
            {metrics.total > 0
              ? <Donut
                  segments={[
                    { label: "Completed",   value: metrics.completed, color: T.green },
                    { label: "In Progress", value: Math.max(metrics.pending - metrics.overdue, 0), color: T.amber },
                    { label: "Overdue",     value: metrics.overdue,   color: T.red },
                  ]}
                  total={metrics.total}
                />
              : <Empty />}
          </div>
        </Card>

        <Card className="ap-rise" style={{ animationDelay: "0.22s" }}>
          <CardHeader tag="Trend" title="Daily Activity" IconComp={Icon.Trend} />
          <div style={{ padding: "16px 24px 20px" }}>
            <DailyChart data={dailySeries} />
          </div>
        </Card>
      </div>

      {/* ════════ ROW 2: Aging + Avg turnaround tile ════════ */}
      <div style={{
        display: "grid",
        gridTemplateColumns: metrics.avgTime ? "1fr 200px" : "1fr",
        gap: 16, marginBottom: 16,
      }}>
        <Card className="ap-rise" style={{ animationDelay: "0.24s" }}>
          <CardHeader tag="Urgency" title="Task Aging" IconComp={Icon.Urgency} />
          <div style={{ padding: "8px 24px 20px" }}>
            <AgingBars buckets={agingBuckets} />
          </div>
        </Card>

        {metrics.avgTime && (
          <Card className="ap-rise" style={{
            animationDelay: "0.26s",
            background: "linear-gradient(145deg, #FFFDF5 0%, #FFF3CC 100%)",
            border: `1px solid ${T.amberBorder}`,
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            padding: "28px 20px", textAlign: "center",
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14, marginBottom: 14,
              background: "linear-gradient(135deg, #E08A00 0%, #C46F00 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: `0 4px 14px ${T.amberGlow}`,
            }}>
              <Icon.Timer size={22} color="#fff" />
            </div>
            <SectionTag color={T.amber}>Avg. Turnaround</SectionTag>
            <div style={{
              fontFamily: "Poppins, sans-serif",
              fontSize: 48, fontWeight: 700, color: T.textPrimary,
              letterSpacing: "-2px", lineHeight: 1,
              marginTop: 10, marginBottom: 8,
            }}>
              {metrics.avgTime}
            </div>
            <p style={{ fontFamily: "Poppins, sans-serif", fontSize: 12, color: T.textMuted, lineHeight: 1.5, margin: 0 }}>
              to complete a task<br />this week
            </p>
          </Card>
        )}
      </div>

      {/* ════════ ROW 3: Top performers ════════ */}
      {(role === "admin" || role === "super_admin") && (
        <Card className="ap-rise" style={{ marginBottom: 16, animationDelay: "0.28s" }}>
          <CardHeader
            tag="Team" title="Top Performers" IconComp={Icon.Team}
            right={
              <span style={{
                fontFamily: "Poppins, sans-serif",
                fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
                color: T.textMuted, background: T.borderLight,
                padding: "3px 12px", borderRadius: 20, border: `1px solid ${T.border}`,
              }}>
                7-day rate
              </span>
            }
          />
          <EmployeeList employees={employeeStats} />
        </Card>
      )}

      {/* ════════ ROW 4: Org benchmark ════════ */}
      {role === "super_admin" && (
        <Card className="ap-rise" style={{ animationDelay: "0.30s" }}>
          <CardHeader tag="Cross-Org" title="Organization Benchmark" IconComp={Icon.Org} />
          <OrgTable orgs={orgData} />
        </Card>
      )}

    </div>
  );
}

export default AnalyticsPage;