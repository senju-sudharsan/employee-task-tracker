import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getTasksByOrganization } from "../services/taskService";
import { getAllOrganizations } from "../services/organizationService";
import { getAllUsers } from "../services/userService";

/* ─────────────────────────────────────────────────────────────
   Global styles — injected once at module load
───────────────────────────────────────────────────────────── */
if (typeof document !== "undefined") {
  const STYLE_ID = "__sad-v2__";
  if (!document.getElementById(STYLE_ID)) {
    const s = document.createElement("style");
    s.id = STYLE_ID;
    s.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');
      *, *::before, *::after { box-sizing: border-box; }

      /* ── keyframes ── */
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      @keyframes hero-in {
        from { opacity:0; transform:translateY(40px); }
        to   { opacity:1; transform:none; }
      }
      @keyframes kpi-in {
        from { opacity:0; transform:translateY(28px); }
        to   { opacity:1; transform:none; }
      }
      @keyframes section-in {
        from { opacity:0; transform:translateY(18px); }
        to   { opacity:1; transform:none; }
      }
      @keyframes row-in {
        from { opacity:0; transform:translateX(-10px); }
        to   { opacity:1; transform:none; }
      }
      @keyframes ring-draw {
        from { stroke-dashoffset: 340; }
      }
      @keyframes prog-grow {
        from { width: 0; }
      }
      @keyframes pulse-amber {
        0%,100% { opacity:1; transform:scale(1);    box-shadow:0 0 0 3px rgba(251,191,36,.28); }
        50%      { opacity:.7; transform:scale(.93); box-shadow:0 0 0 7px rgba(251,191,36,.10); }
      }
      @keyframes dot-beat {
        0%,100% { transform:scale(1);   opacity:1; }
        50%      { transform:scale(1.5); opacity:.6; }
      }

      /* ── animation triggers ── */
      .hero-in    { animation: hero-in    .75s cubic-bezier(.4,0,.2,1) both; }
      .kpi-in     { animation: kpi-in     .75s cubic-bezier(.4,0,.2,1) .15s both; }
      .section-in { animation: section-in .75s cubic-bezier(.4,0,.2,1) .28s both; }

      /* ── KPI card ── */
      .kpi-card {
        position: relative;
        padding: 32px 28px;
        background: #FFFFFF;
        border-radius: 20px;
        border: 1.5px solid #EBEBEB;
        cursor: pointer;
        overflow: hidden;
        transition:
          transform  .32s cubic-bezier(.4,0,.2,1),
          box-shadow .32s cubic-bezier(.4,0,.2,1),
          border-color .32s;
      }
      .kpi-card::before {
        content: '';
        position: absolute; inset: 0;
        background: radial-gradient(circle at 80% 20%, rgba(251,191,36,.11) 0%, transparent 65%);
        opacity: 0;
        transition: opacity .32s;
        pointer-events: none;
      }
      .kpi-card:hover {
        transform: translateY(-7px) scale(1.018);
        border-color: rgba(251,191,36,.52);
        box-shadow:
          0 18px 40px rgba(0,0,0,.09),
          0 0 0 2px rgba(251,191,36,.14),
          0 0 30px rgba(251,191,36,.16);
      }
      .kpi-card:hover::before { opacity: 1; }

      /* ── insight card ── */
      .insight-card {
        padding: 32px;
        background: #FFFFFF;
        border-radius: 20px;
        border: 1.5px solid #EBEBEB;
        box-shadow: 0 2px 12px rgba(0,0,0,.04);
        transition:
          transform  .32s cubic-bezier(.4,0,.2,1),
          box-shadow .32s,
          border-color .32s;
      }
      .insight-card:hover {
        transform: translateY(-4px);
        border-color: rgba(251,191,36,.38);
        box-shadow: 0 16px 40px rgba(0,0,0,.08), 0 0 22px rgba(251,191,36,.11);
      }

      /* ── primary button ── */
      .btn-primary {
        display: flex; align-items: center; gap: 9px;
        padding: 13px 26px;
        background: linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%);
        color: #fff; border: none; border-radius: 13px;
        font-size: 14px; font-weight: 700; cursor: pointer;
        font-family: 'Poppins', sans-serif;
        box-shadow: 0 4px 18px rgba(251,191,36,.36);
        transition: transform .26s cubic-bezier(.4,0,.2,1), box-shadow .26s;
        letter-spacing: .1px;
        white-space: nowrap;
      }
      .btn-primary:hover {
        transform: translateY(-3px) scale(1.02);
        box-shadow: 0 10px 28px rgba(251,191,36,.48);
      }
      .btn-primary:active { transform: translateY(-1px) scale(1); }

      /* ── org table ── */
      .org-table { width: 100%; border-collapse: collapse; }
      .org-table th {
        text-align: left;
        padding: 14px 22px;
        font-size: 10.5px; font-weight: 700;
        letter-spacing: 1px; text-transform: uppercase;
        color: #A0AEC0;
        border-bottom: 1.5px solid #F8FAFC;
        background: #FEFCF9;
      }
      .org-table td {
        padding: 17px 22px;
        font-size: 14px; color: #374151;
        border-bottom: 1px solid #F8FAFC;
        transition: background .18s;
        vertical-align: middle;
      }
      .org-table tbody tr:hover td { background: #FFFBEB; }
      .org-table tbody tr:last-child td { border-bottom: none; }

      /* ── progress fill ── */
      .prog-fill { animation: prog-grow 1.3s cubic-bezier(.4,0,.2,1) backwards; }

      /* ── ring arc ── */
      .ring-arc  { animation: ring-draw 1.3s cubic-bezier(.4,0,.2,1) backwards; }

      /* ── health dot ── */
      .hdot {
        display: inline-block;
        border-radius: 50%;
        flex-shrink: 0;
      }
    `;
    document.head.appendChild(s);
  }
}

/* ─────────────────────────────────────────────────────────────
   Main Component
───────────────────────────────────────────────────────────── */
export default function SuperAdminDashboard({ currentUser }) {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [data, setData]       = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const [orgs, users] = await Promise.all([
        getAllOrganizations(),
        getAllUsers(),
      ]);

      let totalTasks7d     = 0;
      let totalCompleted7d = 0;
      const orgPerf        = [];

      for (const org of orgs) {
        const tasks = await getTasksByOrganization(org.id);

        const created7d = tasks.filter((t) => {
          if (!t.createdAt) return false;
          const d = typeof t.createdAt.toDate === "function"
            ? t.createdAt.toDate() : new Date(t.createdAt);
          return d >= sevenDaysAgo;
        });

        const completed7d = tasks.filter((t) => {
          if (t.status !== "Done" || !t.completedAt) return false;
          const d = typeof t.completedAt.toDate === "function"
            ? t.completedAt.toDate() : new Date(t.completedAt);
          return d >= sevenDaysAgo;
        });

        totalTasks7d     += created7d.length;
        totalCompleted7d += completed7d.length;

        const orgUsers       = users.filter((u) => u.organizationId === org.id);
        const completionRate = created7d.length > 0
          ? Math.round((completed7d.length / created7d.length) * 100) : 0;

        orgPerf.push({
          id: org.id, name: org.name, status: org.status,
          users: orgUsers.length,
          tasksCreated7d: created7d.length,
          completed7d: completed7d.length,
          completionRate,
        });
      }

      const activeOrgs             = orgs.filter((o) => o.status === "active").length;
      const disabledOrgs           = orgs.filter((o) => o.status !== "active").length;
      const totalActiveUsers       = users.filter((u) => u.status === "Active").length;
      const platformCompletionRate = totalTasks7d > 0
        ? Math.round((totalCompleted7d / totalTasks7d) * 100) : 0;
      const sortedByActivity       = [...orgPerf].sort((a, b) => b.tasksCreated7d - a.tasksCreated7d);
      const mostActiveOrg          = sortedByActivity[0] ?? null;
      const dormantOrgs            = orgPerf.filter((o) => o.tasksCreated7d === 0).length;
      const activeEngOrgs          = orgPerf.filter((o) => o.tasksCreated7d > 0).length;
      const totalOrgs              = orgs.length;

      setData({
        activeOrgs, disabledOrgs, totalActiveUsers,
        totalTasks7d, totalCompleted7d, platformCompletionRate,
        orgPerformance: orgPerf,
        mostActiveOrg, dormantOrgs, activeEngOrgs, totalOrgs,
      });
      setLoading(false);
    };

    load();
  }, []);

  /* ── loading ── */
  if (loading || !data) {
    return (
      <div style={sx.loadingWrap}>
        <div style={sx.spinner} />
        <p style={sx.loadingTxt}>Loading platform overview…</p>
      </div>
    );
  }

  const displayName = currentUser?.name || currentUser?.email || "Admin";

  return (
    <div style={sx.page}>

      {/* ══════════════════════════════════════════
          HERO
      ══════════════════════════════════════════ */}
      <div style={sx.hero} className="hero-in">
        <div style={sx.heroGlowTR} />
        <div style={sx.heroGlowBL} />

        <div style={sx.heroInner}>
          <div>
            <div style={sx.badge}>
              <span style={sx.badgeDot} />
              Super Admin
            </div>
            <h1 style={sx.heroTitle}>Welcome, {displayName}</h1>
            <p style={sx.heroSub}>
              Strategic platform intelligence · Enterprise-wide visibility
            </p>
          </div>

          <div style={{ paddingTop: 6 }}>
            <div style={sx.liveChip}>
              <span style={sx.liveDot} />
              <span style={sx.liveTxt}>Live Data</span>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          STRATEGIC KPI STRIP
      ══════════════════════════════════════════ */}
      <div style={sx.kpiGrid} className="kpi-in">
        <KpiCard
          label="Active Organizations"
          value={data.activeOrgs}
          subtitle="Currently operational"
          color="#22C55E"
          gradient="linear-gradient(135deg,#22C55E,#16A34A)"
          icon={ICONS.org}
          onClick={() => navigate("/organizations?filter=active")}
        />
        <KpiCard
          label="Disabled Organizations"
          value={data.disabledOrgs}
          subtitle="Suspended or inactive"
          color="#F59E0B"
          gradient="linear-gradient(135deg,#FBBF24,#F59E0B)"
          icon={ICONS.orgOff}
          onClick={() => navigate("/organizations?filter=disabled")}
        />
        <KpiCard
          label="Active Users"
          value={data.totalActiveUsers}
          subtitle="Across all organizations"
          color="#FB923C"
          gradient="linear-gradient(135deg,#FB923C,#EA580C)"
          icon={ICONS.users}
          onClick={() => navigate("/users")}
        />
        <KpiCard
          label="Tasks Created (7d)"
          value={data.totalTasks7d}
          subtitle="Platform-wide this week"
          color="#FBBF24"
          gradient="linear-gradient(135deg,#FBBF24,#F59E0B)"
          icon={ICONS.task}
          onClick={() => navigate("/analytics")}
        />
        <KpiCard
          label="Completion Rate"
          value={`${data.platformCompletionRate}%`}
          subtitle="7-day platform average"
          color="#A78BFA"
          gradient="linear-gradient(135deg,#C4B5FD,#A78BFA)"
          icon={ICONS.rate}
          onClick={() => navigate("/analytics")}
        />
      </div>

      {/* ══════════════════════════════════════════
          STRATEGIC INSIGHTS
      ══════════════════════════════════════════ */}
      <section style={sx.section} className="section-in">
        <div style={sx.sectionHead}>
          <div>
            <h2 style={sx.sectionTitle}>Strategic Insights</h2>
            <p style={sx.sectionDesc}>Platform intelligence · Past 7 days</p>
          </div>
          <button className="btn-primary" onClick={() => navigate("/analytics")}>
            <span>View Full Analytics</span>
            {ICONS.arrow}
          </button>
        </div>

        <div style={sx.insightsGrid}>

          {/* ── Card 1: Platform Completion ── */}
          <div className="insight-card">
            <InsightHeader
              iconBg="linear-gradient(135deg,#FEF9C3,#FDE68A)"
              iconColor="#CA8A04"
              icon={<><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></>}
              title="Platform Completion"
              desc="7-day task completion across the entire platform"
            />

            {/* animated ring */}
            <div style={sx.ringWrap}>
              <Ring pct={data.platformCompletionRate} color="#FBBF24" trackColor="#FEF9C3" size={136} stroke={12} />
              <div style={sx.ringCenter}>
                <span style={{ ...sx.ringVal, color: "#92400E" }}>{data.platformCompletionRate}%</span>
                <span style={sx.ringLbl}>this week</span>
              </div>
            </div>

            {/* footer stats */}
            <div style={sx.ringFooter}>
              <div style={sx.ringStat}>
                <span style={{ ...sx.ringStatVal, color: "#22C55E" }}>{data.totalCompleted7d}</span>
                <span style={sx.ringStatLbl}>Completed</span>
              </div>
              <div style={sx.ringDivider} />
              <div style={sx.ringStat}>
                <span style={{ ...sx.ringStatVal, color: "#F59E0B" }}>{data.totalTasks7d}</span>
                <span style={sx.ringStatLbl}>Created</span>
              </div>
            </div>
          </div>

          {/* ── Card 2: Weekly Activity Breakdown ── */}
          <div className="insight-card">
            <InsightHeader
              iconBg="linear-gradient(135deg,#FEF3C7,#FDE68A)"
              iconColor="#D97706"
              icon={<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>}
              title="Weekly Activity"
              desc="Task volume and resolution breakdown for this week"
            />

            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <ActivityBar
                label="Tasks Created"
                value={data.totalTasks7d}
                pct={100}
                color="#FBBF24"
                delay="0s"
              />
              <ActivityBar
                label="Tasks Completed"
                value={data.totalCompleted7d}
                pct={data.totalTasks7d > 0
                  ? Math.round((data.totalCompleted7d / data.totalTasks7d) * 100) : 0}
                color="#22C55E"
                delay=".08s"
              />
              <ActivityBar
                label="Organizations Active"
                value={data.activeEngOrgs}
                pct={data.totalOrgs > 0
                  ? Math.round((data.activeEngOrgs / data.totalOrgs) * 100) : 0}
                color="#FB923C"
                delay=".16s"
              />
            </div>
          </div>

          {/* ── Card 3: Organization Engagement ── */}
          <div className="insight-card">
            <InsightHeader
              iconBg="linear-gradient(135deg,#FEF3C7,#FDE68A)"
              iconColor="#D97706"
              icon={<><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></>}
              title="Organization Engagement"
              desc="Activity distribution and health across all organizations"
            />

            {/* segmented engagement bar */}
            <EngagementBar active={data.activeEngOrgs} dormant={data.dormantOrgs} total={data.totalOrgs} />

            {/* most active org highlight */}
            {data.mostActiveOrg && (
              <div style={sx.engHighlight}>
                <span style={sx.engTrophy}>🏆</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={sx.engHighlightLabel}>Most Active This Week</div>
                  <div style={sx.engHighlightName}>{data.mostActiveOrg.name}</div>
                  <div style={sx.engHighlightMeta}>
                    {data.mostActiveOrg.tasksCreated7d} tasks created · {data.mostActiveOrg.completionRate}% completion
                  </div>
                </div>
              </div>
            )}

            {/* dormant chip */}
            <div style={sx.dormantChip}>
              <span className="hdot" style={{ width: 7, height: 7, background: "#FBBF24",
                boxShadow: "0 0 6px rgba(251,191,36,.6)" }} />
              <span>
                <strong>{data.dormantOrgs}</strong> org{data.dormantOrgs !== 1 ? "s" : ""} with zero activity this week
              </span>
            </div>
          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════════
          ORG PERFORMANCE TABLE
      ══════════════════════════════════════════ */}
      <section style={sx.section} className="section-in">
        <div style={sx.sectionHead}>
          <div>
            <h2 style={sx.sectionTitle}>Organization Performance</h2>
            <p style={sx.sectionDesc}>7-day breakdown by organization</p>
          </div>
        </div>

        <div style={sx.tableCard}>
          <table className="org-table">
            <thead>
              <tr>
                <th>Organization</th>
                <th>Status</th>
                <th>Users</th>
                <th>Tasks (7d)</th>
                <th>Completed (7d)</th>
                <th style={{ minWidth: 200 }}>Completion Rate</th>
              </tr>
            </thead>
            <tbody>
              {data.orgPerformance.map((org, i) => {
                const dotColor  = org.completionRate >= 80 ? "#22C55E"
                                : org.completionRate >= 50 ? "#FBBF24"
                                : "#EF4444";
                const barGrad   = org.completionRate >= 80
                  ? "linear-gradient(90deg,#22C55E,#16A34A)"
                  : org.completionRate >= 50
                    ? "linear-gradient(90deg,#FBBF24,#F59E0B)"
                    : "linear-gradient(90deg,#FCA5A5,#EF4444)";

                return (
                  <tr key={org.id} style={{ animation: `row-in .38s ease ${i * .045}s both` }}>
                    {/* name + health dot */}
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span
                          className="hdot"
                          style={{
                            width: 9, height: 9,
                            background: dotColor,
                            boxShadow: `0 0 7px ${dotColor}99`,
                          }}
                        />
                        <span style={{ fontWeight: 600, color: "#0F172A" }}>{org.name}</span>
                      </div>
                    </td>

                    {/* status chip */}
                    <td>
                      <span style={{
                        ...sx.statusChip,
                        ...(org.status === "active" ? sx.chipActive : sx.chipInactive),
                      }}>
                        {org.status}
                      </span>
                    </td>

                    <td style={{ color: "#94A3B8", fontWeight: 500 }}>{org.users}</td>
                    <td style={{ fontWeight: 600 }}>{org.tasksCreated7d}</td>
                    <td style={{ fontWeight: 600, color: "#22C55E" }}>{org.completed7d}</td>

                    {/* animated progress bar */}
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={sx.miniBar}>
                          <div
                            className="prog-fill"
                            style={{
                              height: "100%", borderRadius: 100,
                              width: `${org.completionRate}%`,
                              background: barGrad,
                              animationDelay: `${i * .055}s`,
                              boxShadow: org.completionRate > 0
                                ? `0 0 8px ${dotColor}55` : "none",
                            }}
                          />
                        </div>
                        <span style={{
                          fontSize: 13, fontWeight: 700,
                          color: dotColor, minWidth: 38,
                          textAlign: "right",
                        }}>
                          {org.completionRate}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Sub-components
───────────────────────────────────────────────────────────── */

function KpiCard({ label, value, subtitle, color, gradient, icon, onClick }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="kpi-card"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* icon */}
      <div style={{
        width: 56, height: 56, borderRadius: 15, marginBottom: 22,
        display: "flex", alignItems: "center", justifyContent: "center",
        position: "relative", zIndex: 1,
        background:  hovered ? gradient : `${color}12`,
        color:       hovered ? "#fff"   : color,
        transform:   hovered ? "scale(1.1) rotate(5deg)" : "scale(1)",
        boxShadow:   hovered ? `0 8px 22px ${color}44` : "none",
        transition:  "all .32s cubic-bezier(.4,0,.2,1)",
      }}>
        {icon}
      </div>

      {/* text */}
      <div style={{ position: "relative", zIndex: 1 }}>
        <p style={sx.kpiLabel}>{label}</p>
        <p style={{
          ...sx.kpiValue,
          background:           hovered ? gradient : "transparent",
          WebkitBackgroundClip: hovered ? "text"   : "unset",
          WebkitTextFillColor:  hovered ? "transparent" : color,
          backgroundClip:       hovered ? "text"   : "unset",
          transition: "all .32s ease",
        }}>
          {value}
        </p>
        <p style={sx.kpiSub}>{subtitle}</p>
      </div>

      {/* arrow */}
      <div style={{
        position: "absolute", bottom: 24, right: 24, color,
        opacity:   hovered ? 1 : 0,
        transform: hovered ? "translateX(0)" : "translateX(-8px)",
        transition: "all .26s ease",
      }}>
        {ICONS.arrowSm}
      </div>
    </div>
  );
}

function InsightHeader({ iconBg, iconColor, icon, title, desc }) {
  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
        <div style={{
          width: 50, height: 50, borderRadius: 13,
          background: iconBg, display: "flex",
          alignItems: "center", justifyContent: "center",
          boxShadow: "0 3px 10px rgba(0,0,0,.07)", flexShrink: 0,
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
            stroke={iconColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            {icon}
          </svg>
        </div>
        <h3 style={{ fontSize: 17, fontWeight: 700, color: "#0F172A", margin: 0, letterSpacing: "-.2px" }}>
          {title}
        </h3>
      </div>
      <p style={{ fontSize: 13.5, color: "#94A3B8", lineHeight: 1.6, margin: 0, marginBottom: 26, fontWeight: 500 }}>
        {desc}
      </p>
    </>
  );
}

function Ring({ pct, color, trackColor = "#F1F5F9", size = 136, stroke = 12 }) {
  const r    = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={trackColor} strokeWidth={stroke} />
      <circle
        cx={size/2} cy={size/2} r={r} fill="none"
        stroke={color} strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={circ - (pct / 100) * circ}
        className="ring-arc"
        style={{ filter: `drop-shadow(0 0 7px ${color}88)` }}
      />
    </svg>
  );
}

function ActivityBar({ label, value, pct, color, delay }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#64748B" }}>{label}</span>
        <span style={{ fontSize: 18, fontWeight: 800, color, letterSpacing: "-.6px" }}>{value}</span>
      </div>
      <div style={{
        height: 9, background: "#F8FAFC", borderRadius: 100, overflow: "hidden",
        border: "1px solid #F1F5F9",
      }}>
        <div
          className="prog-fill"
          style={{
            height: "100%", borderRadius: 100,
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${color}bb, ${color})`,
            animationDelay: delay,
            boxShadow: `0 0 8px ${color}44`,
          }}
        />
      </div>
    </div>
  );
}

function EngagementBar({ active, dormant, total }) {
  const activePct  = total > 0 ? Math.round((active  / total) * 100) : 0;
  const dormantPct = total > 0 ? Math.round((dormant / total) * 100) : 0;

  return (
    <div style={{ marginBottom: 22 }}>
      {/* segmented bar */}
      <div style={{
        height: 10, borderRadius: 100, overflow: "hidden",
        background: "#F8FAFC", display: "flex", gap: 3, marginBottom: 10,
      }}>
        {active > 0 && (
          <div className="prog-fill" style={{
            width: `${activePct}%`, height: "100%", borderRadius: 100,
            background: "linear-gradient(90deg,#22C55E,#16A34A)",
            boxShadow: "0 0 8px #22C55E44",
            animationDelay: "0s",
          }} />
        )}
        {dormant > 0 && (
          <div className="prog-fill" style={{
            width: `${dormantPct}%`, height: "100%", borderRadius: 100,
            background: "linear-gradient(90deg,#FBBF24,#F59E0B)",
            animationDelay: ".1s",
          }} />
        )}
      </div>
      {/* legend */}
      <div style={{ display: "flex", gap: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span className="hdot" style={{ width: 7, height: 7, background: "#22C55E" }} />
          <span style={{ fontSize: 11.5, color: "#64748B", fontWeight: 600 }}>
            {active} Active ({activePct}%)
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span className="hdot" style={{ width: 7, height: 7, background: "#FBBF24" }} />
          <span style={{ fontSize: 11.5, color: "#64748B", fontWeight: 600 }}>
            {dormant} Dormant ({dormantPct}%)
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Icons
───────────────────────────────────────────────────────────── */
const mkIcon = (d) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    {d}
  </svg>
);

const ICONS = {
  org: mkIcon(<><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></>),
  orgOff: mkIcon(<><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></>),
  users: mkIcon(<><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></>),
  task: mkIcon(<><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></>),
  rate: mkIcon(<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>),
  arrow: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7"/>
    </svg>
  ),
  arrowSm: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7"/>
    </svg>
  ),
};

/* ─────────────────────────────────────────────────────────────
   Styles
───────────────────────────────────────────────────────────── */
const sx = {
  /* page */
page: {
     fontFamily: "'Poppins',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
    display: "flex", flexDirection: "column", gap: 60,
    maxWidth: 1320, margin: "0 auto",
     paddingBottom: 56,
   },

  /* loading */
  loadingWrap: {
    fontFamily: "'Poppins',sans-serif",
    display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    minHeight: "100vh", gap: 20, backgroundColor: "#FEFCF9",
  },
  spinner: {
    width: 60, height: 60,
    border: "5px solid #F1F5F9", borderTop: "5px solid #FBBF24",
    borderRadius: "50%", animation: "spin 1s cubic-bezier(.5,0,.5,1) infinite",
  },
  loadingTxt: { fontSize: 15, color: "#94A3B8", fontWeight: 600 },

  /* hero */
  hero: {
    position: "relative",
    padding: "60px 64px",
    background: "linear-gradient(135deg,#FFFFFF 0%,#FFFDF7 45%,#FFF8E1 100%)",
    borderRadius: 24,
    border: "1.5px solid rgba(251,191,36,.20)",
    overflow: "hidden",
    boxShadow: "0 6px 32px rgba(251,191,36,.09), 0 2px 8px rgba(0,0,0,.04)",
  },
  heroGlowTR: {
    position: "absolute", top: -110, right: -110,
    width: 400, height: 400,
    background: "radial-gradient(circle,rgba(251,191,36,.18) 0%,transparent 68%)",
    borderRadius: "50%", pointerEvents: "none",
  },
  heroGlowBL: {
    position: "absolute", bottom: -70, left: -50,
    width: 260, height: 260,
    background: "radial-gradient(circle,rgba(251,191,36,.09) 0%,transparent 70%)",
    borderRadius: "50%", pointerEvents: "none",
  },
  heroInner: {
    position: "relative", zIndex: 1,
    display: "flex", justifyContent: "space-between", alignItems: "flex-start",
  },
  badge: {
    display: "inline-flex", alignItems: "center", gap: 9,
    padding: "8px 18px",
    background: "linear-gradient(135deg,#FEF3C7,#FDE68A)",
    borderRadius: 100, marginBottom: 22,
    fontSize: 10.5, fontWeight: 800, letterSpacing: "1.5px",
    textTransform: "uppercase", color: "#92400E",
    boxShadow: "0 3px 12px rgba(146,64,14,.16)",
    border: "1px solid rgba(146,64,14,.10)",
  },
  badgeDot: {
    display: "inline-block", width: 6, height: 6, borderRadius: "50%",
    background: "#D97706", boxShadow: "0 0 8px rgba(217,119,6,.8)",
    animation: "dot-beat 2.4s ease-in-out infinite",
  },
  heroTitle: {
    fontSize: 52, fontWeight: 800, color: "#0F172A",
    margin: 0, marginBottom: 12,
    letterSpacing: "-1.8px", lineHeight: 1.08,
  },
  heroSub: {
    fontSize: 16.5, color: "#94A3B8", margin: 0, fontWeight: 500,
    lineHeight: 1.65, maxWidth: 520,
  },
  liveChip: {
    display: "flex", alignItems: "center", gap: 9,
    padding: "11px 20px",
    background: "linear-gradient(135deg,#FFFBEB,#FEF3C7)",
    borderRadius: 100,
    border: "1.5px solid rgba(251,191,36,.30)",
    boxShadow: "0 3px 14px rgba(251,191,36,.18)",
  },
  liveDot: {
    display: "inline-block", width: 9, height: 9, borderRadius: "50%",
    background: "#FBBF24", boxShadow: "0 0 0 3px rgba(251,191,36,.28)",
    animation: "pulse-amber 2s ease-in-out infinite",
  },
  liveTxt: { fontSize: 12.5, fontWeight: 700, color: "#92400E" },

  /* kpi strip */
  kpiGrid: { display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 20 },
  kpiLabel: {
    fontSize: 11, fontWeight: 700, color: "#A0AEC0",
    textTransform: "uppercase", letterSpacing: "1px",
    margin: 0, marginBottom: 7,
  },
  kpiValue: {
    fontSize: 42, fontWeight: 800,
    margin: 0, marginBottom: 5, letterSpacing: "-2px",
  },
  kpiSub: { fontSize: 12, color: "#CBD5E1", margin: 0, fontWeight: 500 },

  /* sections */
  section: { display: "flex", flexDirection: "column", gap: 26 },
  sectionHead: {
    display: "flex", justifyContent: "space-between",
    alignItems: "center", marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 32, fontWeight: 800, color: "#0F172A",
    margin: 0, marginBottom: 7, letterSpacing: "-1px",
  },
  sectionDesc: { fontSize: 14.5, color: "#A0AEC0", margin: 0, fontWeight: 500 },

  /* insights grid */
  insightsGrid: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 22 },

  /* ring */
  ringWrap: {
    position: "relative", display: "flex",
    justifyContent: "center", alignItems: "center",
    height: 136, marginBottom: 20,
  },
  ringCenter: {
    position: "absolute", display: "flex",
    flexDirection: "column", alignItems: "center", justifyContent: "center",
  },
  ringVal:    { fontSize: 28, fontWeight: 800, letterSpacing: "-1.2px" },
  ringLbl:    { fontSize: 11, color: "#A0AEC0", fontWeight: 600, marginTop: 3 },
  ringFooter: {
    display: "flex", justifyContent: "center", alignItems: "center", gap: 24,
    paddingTop: 18, borderTop: "1px solid #F8FAFC",
  },
  ringStat:    { display: "flex", flexDirection: "column", alignItems: "center", gap: 3 },
  ringStatVal: { fontSize: 22, fontWeight: 800, letterSpacing: "-1px" },
  ringStatLbl: { fontSize: 11, color: "#A0AEC0", fontWeight: 600 },
  ringDivider: { width: 1, height: 28, background: "#F1F5F9" },

  /* engagement card */
  engHighlight: {
    display: "flex", alignItems: "flex-start", gap: 12,
    padding: "15px 16px",
    background: "linear-gradient(135deg,#FFFBEB,#FEF9C3)",
    borderRadius: 14, border: "1px solid rgba(251,191,36,.22)",
    marginBottom: 14,
    boxShadow: "0 2px 10px rgba(251,191,36,.09)",
  },
  engTrophy:         { fontSize: 20, lineHeight: 1, flexShrink: 0, marginTop: 1 },
  engHighlightLabel: {
    fontSize: 10, fontWeight: 700, color: "#92400E",
    textTransform: "uppercase", letterSpacing: ".8px", marginBottom: 3,
  },
  engHighlightName: { fontSize: 15, fontWeight: 700, color: "#0F172A", marginBottom: 2 },
  engHighlightMeta: { fontSize: 12, color: "#64748B", fontWeight: 500 },
  dormantChip: {
    display: "flex", alignItems: "center", gap: 9,
    padding: "10px 14px",
    background: "#FAFAFA", borderRadius: 10,
    border: "1px solid #F1F5F9",
    fontSize: 13, color: "#64748B", fontWeight: 500,
  },

  /* table */
  tableCard: {
    background: "#fff", borderRadius: 20,
    border: "1.5px solid #EBEBEB", overflow: "hidden",
    boxShadow: "0 4px 20px rgba(0,0,0,.04)",
  },
  statusChip: {
    display: "inline-block", padding: "4px 12px",
    borderRadius: 100, fontSize: 11, fontWeight: 700,
    letterSpacing: ".5px", textTransform: "capitalize",
  },
  chipActive:   { color: "#166534", background: "#DCFCE7" },
  chipInactive: { color: "#92400E", background: "#FEF3C7" },
  miniBar: {
    flex: 1, height: 8, background: "#F8FAFC",
    borderRadius: 100, overflow: "hidden",
    border: "1px solid #F1F5F9",
  },
};