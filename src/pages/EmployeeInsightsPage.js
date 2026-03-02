import { useEffect, useMemo, useState, useRef } from "react";
import { auth } from "../firebase";
import { getTasksByEmployee } from "../services/taskService";

/* ─────────────────────────────────────────────────────────────
   Global styles — mirrors AnalyticsPage ap-* classes
───────────────────────────────────────────────────────────── */
if (typeof document !== "undefined" && !document.getElementById("ei-styles")) {
  const s = document.createElement("style");
  s.id = "ei-styles";
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
    *, *::before, *::after { box-sizing: border-box; }

    @keyframes ei-rise {
      from { opacity: 0; transform: translateY(18px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes ei-spin  { to { transform: rotate(360deg); } }
    @keyframes ei-pulse {
      0%, 100% { opacity: 1; }
      50%       { opacity: 0.5; }
    }

    .ei-rise { animation: ei-rise 0.55s cubic-bezier(0.22,1,0.36,1) both; }

    .ei-spinner {
      width: 36px; height: 36px;
      border: 3px solid rgba(214,119,0,0.15);
      border-top-color: #D67700;
      border-radius: 50%;
      animation: ei-spin 0.75s linear infinite;
    }

    .ei-card {
      transition: transform 0.25s cubic-bezier(0.22,1,0.36,1), box-shadow 0.25s ease;
    }
    .ei-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 40px rgba(214,119,0,0.10), 0 4px 16px rgba(0,0,0,0.05) !important;
    }

    .ei-stat {
      transition: transform 0.2s cubic-bezier(0.22,1,0.36,1), box-shadow 0.2s ease;
    }
    .ei-stat:hover {
      transform: translateY(-3px);
      box-shadow: 0 10px 32px rgba(214,119,0,0.14) !important;
    }

    .ei-bar { transition: width 1s cubic-bezier(0.22,1,0.36,1); }
  `;
  document.head.appendChild(s);
}

/* ─────────────────────────────────────────────────────────────
   Design tokens
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
   SVG icons
───────────────────────────────────────────────────────────── */
const Icon = {
  Tasks: ({ size = 20, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 2H7a2 2 0 00-2 2v16a2 2 0 002 2h10a2 2 0 002-2V4a2 2 0 00-2-2h-2"/>
      <rect x="9" y="2" width="6" height="4" rx="1"/>
      <path d="M9 12h6M9 16h4"/>
    </svg>
  ),
  Complete: ({ size = 20, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M8 12l3 3 5-6"/>
    </svg>
  ),
  InProgress: ({ size = 20, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 22h14M5 2h14"/>
      <path d="M17 22v-4.172a2 2 0 00-.586-1.414L12 12l-4.414 4.414A2 2 0 007 17.828V22"/>
      <path d="M7 2v4.172a2 2 0 00.586 1.414L12 12l4.414-4.414A2 2 0 0017 6.172V2"/>
    </svg>
  ),
  Overdue: ({ size = 20, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  ),
  Rate: ({ size = 20, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <circle cx="12" cy="12" r="6"/>
      <circle cx="12" cy="12" r="2"/>
    </svg>
  ),
  Trend: ({ size = 20, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
      <polyline points="16 7 22 7 22 13"/>
    </svg>
  ),
  Distribution: ({ size = 20, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.21 15.89A10 10 0 118 2.83"/>
      <path d="M22 12A10 10 0 0012 2v10z"/>
    </svg>
  ),
  History: ({ size = 20, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6"  y1="20" x2="6"  y2="14"/>
      <line x1="2"  y1="20" x2="22" y2="20"/>
    </svg>
  ),
  Calendar: ({ size = 20, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8"  y1="2" x2="8"  y2="6"/>
      <line x1="3"  y1="10" x2="21" y2="10"/>
    </svg>
  ),
  Timer: ({ size = 20, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="13" r="8"/>
      <path d="M12 9v4l2.5 2.5"/>
      <path d="M9.5 2.5h5M12 2.5v1.8"/>
    </svg>
  ),
};

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
    <div className={`ei-card ${className}`} style={{
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

function Empty({ msg = "No data available" }) {
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
        <Icon.History size={20} color={T.amber} />
      </div>
      <span style={{
        fontFamily: "Poppins, sans-serif",
        fontSize: 12.5, color: T.textMuted, fontWeight: 500,
      }}>
        {msg}
      </span>
    </div>
  );
}

function StatCard({ label, value, sub, IconComp, accentColor, accentPale, accentBorder, delay }) {
  const animated = useCounter(value);
  return (
    <div className="ei-stat ei-rise" style={{
      background: "linear-gradient(145deg, #FFFDF5 0%, #FFF8E1 100%)",
      border: `1px solid ${accentBorder}`,
      borderRadius: 20,
      padding: "22px 24px",
      boxShadow: "0 2px 16px rgba(214,119,0,0.06)",
      animationDelay: delay,
      position: "relative",
      overflow: "hidden",
    }}>
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
          background: accentPale,
          border: `1px solid ${accentBorder}`,
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
        <p style={{
          fontFamily: "Poppins, sans-serif",
          fontSize: 12, color: T.textMuted, margin: 0, fontWeight: 400,
        }}>
          {sub}
        </p>
      )}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        height: 3,
        background: `linear-gradient(90deg, ${accentColor}, transparent)`,
        opacity: 0.5,
      }} />
    </div>
  );
}

function RateGauge({ rate, color, sub }) {
  const clamped = Math.min(Math.max(rate, 0), 100);
  const R = 68; const sw = 10;
  const circ = 2 * Math.PI * R;
  const track = circ * 0.75;
  const fill = track * (clamped / 100);
  const statusLabel = rate >= 70 ? "Excellent" : rate >= 40 ? "Moderate" : "Needs Work";

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
            style={{ transition: "stroke-dasharray 1s cubic-bezier(0.22,1,0.36,1)" }} />
        </svg>
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
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
            {statusLabel}
          </span>
        </div>
      </div>
      {sub && (
        <p style={{
          fontFamily: "Poppins, sans-serif", fontSize: 12.5,
          color: T.textMuted, margin: "8px 0 0", textAlign: "center",
        }}>
          {sub}
        </p>
      )}
    </div>
  );
}

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
                style={{
                  transform: "rotate(-90deg)", transformOrigin: "50% 50%",
                  transition: "stroke-dasharray 0.8s cubic-bezier(0.22,1,0.36,1)",
                }}
              />
            );
          })}
        </svg>
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
        }}>
          <span style={{
            fontFamily: "Poppins, sans-serif", fontSize: 30, fontWeight: 700,
            color: T.textPrimary, letterSpacing: "-1px", lineHeight: 1,
          }}>
            {total}
          </span>
          <span style={{
            fontFamily: "Poppins, sans-serif", fontSize: 9.5, fontWeight: 600,
            color: T.textMuted, letterSpacing: "0.12em", textTransform: "uppercase", marginTop: 3,
          }}>
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
              <div className="ei-bar" style={{
                height: "100%",
                width: `${total > 0 ? (seg.value / total) * 100 : 0}%`,
                background: seg.color, borderRadius: 4,
              }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DualBarChart({ data }) {
  if (!data || data.length === 0) return <Empty msg="No monthly history yet" />;
  const maxVal = Math.max(...data.map(([, a, c]) => Math.max(a, c)), 1);
  const fmtMonth = (key) => {
    const [y, m] = key.split("-");
    return new Date(+y, +m - 1).toLocaleDateString("en-US", { month: "short", year: "2-digit" });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      {data.map(([month, assigned, completed]) => (
        <div key={month}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, alignItems: "center" }}>
            <span style={{ fontFamily: "Poppins, sans-serif", fontSize: 12.5, color: T.textSecondary, fontWeight: 500 }}>
              {fmtMonth(month)}
            </span>
            <span style={{ fontFamily: "Poppins, sans-serif", fontSize: 11, color: T.textMuted }}>
              {completed}/{assigned} completed
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {[
              { val: assigned,  grad: `linear-gradient(90deg, ${T.amberMid}, #C46F00)`, label: "Assigned" },
              { val: completed, grad: `linear-gradient(90deg, ${T.green},    #15803D)`,  label: "Completed" },
            ].map(({ val, grad, label }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{
                  fontFamily: "Poppins, sans-serif", fontSize: 10, color: T.textMuted,
                  width: 64, textAlign: "right", flexShrink: 0,
                }}>
                  {label}
                </span>
                <div style={{ flex: 1, height: 24, background: T.borderLight, borderRadius: 7, overflow: "hidden" }}>
                  <div className="ei-bar" style={{
                    height: "100%",
                    width: `${(val / maxVal) * 100}%`,
                    background: grad, borderRadius: 7,
                    minWidth: val > 0 ? 32 : 0,
                    display: "flex", alignItems: "center",
                    justifyContent: "flex-end", paddingRight: 10,
                  }}>
                    {val > 0 && <span style={{ fontSize: 11, color: "#fff", fontWeight: 600 }}>{val}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
      <div style={{ display: "flex", gap: 20, marginTop: 4, paddingTop: 14, borderTop: `1px solid ${T.borderLight}` }}>
        {[
          { color: T.amberMid, label: "Assigned" },
          { color: T.green,    label: "Completed" },
        ].map(l => (
          <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <div style={{ width: 16, height: 3, background: l.color, borderRadius: 2 }} />
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
   Helpers
───────────────────────────────────────────────────────────── */
const toDate = (d) =>
  typeof d?.toDate === "function" ? d.toDate() : d ? new Date(d) : null;

const isOverdue = (task) => {
  if (!task.deadline || task.status === "Done") return false;
  const d = toDate(task.deadline);
  return d && d < new Date();
};

const buildMonthlySeries = (tasks, field) => {
  const map = {};
  tasks.forEach((t) => {
    if (!t[field]) return;
    const d = toDate(t[field]);
    if (!d) return;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    map[key] = (map[key] || 0) + 1;
  });
  return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).slice(-6);
};

const avgTurnaround = (tasks) => {
  const done = tasks.filter(t => t.status === "Done" && t.createdAt && t.completedAt);
  if (!done.length) return null;
  const avg = done.reduce((s, t) => s + (toDate(t.completedAt) - toDate(t.createdAt)), 0) / done.length;
  const h = avg / 3600000;
  return h < 24 ? `${Math.round(h)}h` : `${(h / 24).toFixed(1)}d`;
};

/* ─────────────────────────────────────────────────────────────
   EmployeeInsightsPage
   — padding managed here; Layout.jsx supplies its own 40px
     padding so we use padding:0 on the outer wrapper and
     let the inner content breathe with gap/margin only.
───────────────────────────────────────────────────────────── */
function EmployeeInsightsPage() {
  const [tasks,   setTasks]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!auth.currentUser) return;
      setLoading(true);
      try {
        const data = await getTasksByEmployee(auth.currentUser.uid);
        setTasks(data || []);
      } catch (err) {
        console.error("Failed to load employee insights:", err);
      }
      setLoading(false);
    };
    load();
  }, []);

  const metrics = useMemo(() => {
    const total      = tasks.length;
    const completed  = tasks.filter(t => t.status === "Done").length;
    const overdue    = tasks.filter(t => isOverdue(t)).length;
    const pending    = total - completed;
    const turnaround = avgTurnaround(tasks);
    return {
      total, completed, pending, overdue, turnaround,
      completionRate: total     ? Math.round((completed / total) * 100)                 : 0,
      onTimeRate:     completed ? Math.round(((completed - overdue) / completed) * 100) : 0,
    };
  }, [tasks]);

  const completedMonthly = useMemo(() =>
    buildMonthlySeries(tasks.filter(t => t.completedAt), "completedAt"), [tasks]);

  const createdMonthly = useMemo(() =>
    buildMonthlySeries(tasks, "createdAt"), [tasks]);

  const assignedVsCompleted = useMemo(() => {
    const cm = {}; const co = {};
    createdMonthly.forEach(([m, v])   => { cm[m] = v; });
    completedMonthly.forEach(([m, v]) => { co[m] = v; });
    const all = [...new Set([
      ...createdMonthly.map(([m]) => m),
      ...completedMonthly.map(([m]) => m),
    ])].sort();
    return all.map(m => [m, cm[m] || 0, co[m] || 0]);
  }, [createdMonthly, completedMonthly]);

  if (loading) {
    return (
      <div style={{
        minHeight: "60vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 16,
        background: T.pageBg, fontFamily: "Poppins, sans-serif",
      }}>
        <div className="ei-spinner" />
        <span style={{ fontSize: 13, color: T.textMuted, fontWeight: 500 }}>
          Loading your insights…
        </span>
      </div>
    );
  }

  return (
    /*
      Outer wrapper:
      - background + min-height set here (Layout's <main> is transparent)
      - NO extra horizontal padding — Layout already provides 40px on all sides
      - maxWidth + auto margin keep content from stretching on ultra-wide screens
      - paddingBottom gives breathing room at the bottom of the scroll area
    */
    <div style={{
      fontFamily: "Poppins, sans-serif",
      maxWidth: 1320,
      margin: "0 auto",
      paddingBottom: 56,
    }}>

      {/* ── HEADER ─────────────────────────────────────────── */}
      <div className="ei-rise" style={{
        paddingBottom: 24,
        marginBottom: 24,
        borderBottom: `1px solid ${T.border}`,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 16,
      }}>
        <div>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: T.amberPale, border: `1px solid ${T.amberBorder}`,
            borderRadius: 20, padding: "5px 16px", marginBottom: 14,
          }}>
            <div style={{
              width: 7, height: 7, borderRadius: "50%", background: T.amber,
              animation: "ei-pulse 2s ease-in-out infinite",
            }} />
            <span style={{
              fontFamily: "Poppins, sans-serif",
              fontSize: 11, fontWeight: 700, color: T.amber, letterSpacing: "0.06em",
            }}>
              Personal Analytics
            </span>
          </div>
          <h1 style={{
            fontFamily: "Poppins, sans-serif",
            fontSize: 32, fontWeight: 700, color: T.textPrimary,
            margin: 0, letterSpacing: "-0.8px", lineHeight: 1.1,
          }}>
            My Insights
          </h1>
          <p style={{
            fontFamily: "Poppins, sans-serif",
            fontSize: 14, color: T.textSecondary, margin: "6px 0 0", fontWeight: 400,
          }}>
            Your personal productivity overview
          </p>
        </div>

        {metrics.turnaround && (
          <div style={{
            display: "flex", alignItems: "center", gap: 12,
            background: "linear-gradient(145deg, #FFFDF5 0%, #FFF8E1 100%)",
            border: `1px solid ${T.amberBorder}`,
            borderRadius: 16, padding: "12px 18px",
            boxShadow: "0 2px 12px rgba(214,119,0,0.08)",
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: T.amberPale, border: `1px solid ${T.amberBorder}`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Icon.Timer size={18} color={T.amber} />
            </div>
            <div>
              <div style={{
                fontFamily: "Poppins, sans-serif",
                fontSize: 10, fontWeight: 700, color: T.textMuted,
                letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 2,
              }}>
                Avg Turnaround
              </div>
              <div style={{
                fontFamily: "Poppins, sans-serif",
                fontSize: 22, fontWeight: 700, color: T.textPrimary,
                letterSpacing: "-0.5px", lineHeight: 1,
              }}>
                {metrics.turnaround}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── STAT STRIP ─────────────────────────────────────── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: 16,
        marginBottom: 20,
      }}>
        <StatCard
          label="Total Tasks"  value={metrics.total}     IconComp={Icon.Tasks}
          accentColor={T.blue}  accentPale={T.bluePale}  accentBorder={T.blueBorder}
          sub="All assigned tasks"    delay="0.06s"
        />
        <StatCard
          label="Completed"    value={metrics.completed} IconComp={Icon.Complete}
          accentColor={T.green} accentPale={T.greenPale} accentBorder={T.greenBorder}
          sub={`${metrics.completionRate}% completion rate`} delay="0.10s"
        />
        <StatCard
          label="In Progress"  value={metrics.pending}   IconComp={Icon.InProgress}
          accentColor={T.amber} accentPale={T.amberPale} accentBorder={T.amberBorder}
          sub="Active tasks"         delay="0.14s"
        />
        <StatCard
          label="Overdue"      value={metrics.overdue}   IconComp={Icon.Overdue}
          accentColor={T.red}   accentPale={T.redPale}   accentBorder={T.redBorder}
          sub="Need immediate attention" delay="0.18s"
        />
      </div>

      {/* ── ROW 1: Gauges + Donut ──────────────────────────── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1.4fr",
        gap: 16,
        marginBottom: 16,
      }}>
        <Card className="ei-rise" style={{ animationDelay: "0.14s" }}>
          <CardHeader tag="Performance" title="Completion Rate" IconComp={Icon.Rate} />
          <div style={{ padding: "8px 16px 20px" }}>
            {metrics.total > 0
              ? <RateGauge
                  rate={metrics.completionRate}
                  color={metrics.completionRate >= 70 ? T.green : metrics.completionRate >= 40 ? T.amber : T.red}
                  sub={`${metrics.completed} of ${metrics.total} tasks completed`}
                />
              : <Empty msg="No tasks yet" />
            }
          </div>
        </Card>

        <Card className="ei-rise" style={{ animationDelay: "0.18s" }}>
          <CardHeader tag="Timeliness" title="On-Time Rate" IconComp={Icon.Trend} />
          <div style={{ padding: "8px 16px 20px" }}>
            {metrics.completed > 0
              ? <RateGauge
                  rate={metrics.onTimeRate}
                  color={metrics.onTimeRate >= 70 ? T.green : metrics.onTimeRate >= 40 ? T.amber : T.red}
                  sub={`${metrics.completed - metrics.overdue} completed on time`}
                />
              : <Empty msg="No completions yet" />
            }
          </div>
        </Card>

        <Card className="ei-rise" style={{ animationDelay: "0.22s" }}>
          <CardHeader
            tag="Breakdown" title="Task Status" IconComp={Icon.Distribution}
            right={
              <span style={{
                fontFamily: "Poppins, sans-serif",
                fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
                color: T.amber, background: T.amberPale,
                padding: "3px 12px", borderRadius: 20, border: `1px solid ${T.amberBorder}`,
              }}>
                All time
              </span>
            }
          />
          <div style={{ padding: "20px 24px" }}>
            {metrics.total > 0
              ? <Donut
                  segments={[
                    { label: "Completed",   value: metrics.completed, color: T.green },
                    { label: "In Progress", value: metrics.pending,   color: T.amber },
                    { label: "Overdue",     value: metrics.overdue,   color: T.red   },
                  ]}
                  total={metrics.total}
                />
              : <Empty />
            }
          </div>
        </Card>
      </div>

      {/* ── ROW 2: Summary tile + Monthly chart ────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 16 }}>

        <Card className="ei-rise" style={{
          animationDelay: "0.24s",
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
            boxShadow: "0 4px 14px rgba(214,119,0,0.30)",
          }}>
            <Icon.Calendar size={22} color="#fff" />
          </div>
          <SectionTag color={T.amber}>Monthly</SectionTag>
          <div style={{
            fontFamily: "Poppins, sans-serif",
            fontSize: 42, fontWeight: 700, color: T.textPrimary,
            letterSpacing: "-1.5px", lineHeight: 1,
            marginTop: 10, marginBottom: 8,
          }}>
            {assignedVsCompleted.length}
          </div>
          <p style={{
            fontFamily: "Poppins, sans-serif",
            fontSize: 12, color: T.textMuted, lineHeight: 1.5, margin: 0,
          }}>
            months of<br />activity tracked
          </p>
        </Card>

        <Card className="ei-rise" style={{ animationDelay: "0.26s" }}>
          <CardHeader
            tag="History" title="Assigned vs Completed" IconComp={Icon.History}
            right={
              <span style={{
                fontFamily: "Poppins, sans-serif",
                fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
                color: T.textMuted, background: T.borderLight,
                padding: "3px 12px", borderRadius: 20, border: `1px solid ${T.border}`,
              }}>
                Last 6 months
              </span>
            }
          />
          <div style={{ padding: "20px 24px" }}>
            <DualBarChart data={assignedVsCompleted} />
          </div>
        </Card>

      </div>

    </div>
  );
}

export default EmployeeInsightsPage;