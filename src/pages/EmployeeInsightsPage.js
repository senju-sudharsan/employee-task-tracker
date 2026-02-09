import { useEffect, useMemo, useState } from "react";
import { auth } from "../firebase";

import { getTasksByEmployee } from "../services/taskService";

/* =========================
   REUSABLE COMPONENTS
========================= */

function ChartCard({ title, children, isEmpty = false }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 12,
        padding: 24,
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        border: "1px solid #e8e8e8",
        minHeight: 280,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <h3
        style={{
          margin: 0,
          marginBottom: 20,
          fontSize: 16,
          fontWeight: 600,
          color: "#1a1a1a",
          fontFamily: "Poppins, sans-serif",
        }}
      >
        {title}
      </h3>
      {isEmpty ? (
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#999",
            fontSize: 14,
          }}
        >
          No data available
        </div>
      ) : (
        <div style={{ flex: 1 }}>{children}</div>
      )}
    </div>
  );
}

function DonutChart({ data, total, centerLabel }) {
  const radius = 70;
  const strokeWidth = 20;
  const circumference = 2 * Math.PI * radius;

  let currentOffset = 0;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 32, flexWrap: "wrap" }}>
      <div style={{ position: "relative", width: 180, height: 180, flexShrink: 0 }}>
        <svg width="180" height="180" viewBox="0 0 180 180">
          <circle
            cx="90"
            cy="90"
            r={radius}
            fill="none"
            stroke="#f0f0f0"
            strokeWidth={strokeWidth}
          />

          {data.map((segment, i) => {
            const percentage = total > 0 ? segment.value / total : 0;
            const segmentLength = circumference * percentage;
            const offset = currentOffset;
            currentOffset += segmentLength;

            return (
              <circle
                key={i}
                cx="90"
                cy="90"
                r={radius}
                fill="none"
                stroke={segment.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${segmentLength} ${circumference}`}
                strokeDashoffset={-offset}
                style={{
                  transition: "stroke-dasharray 0.6s ease",
                  transform: "rotate(-90deg)",
                  transformOrigin: "50% 50%",
                }}
              />
            );
          })}
        </svg>

        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 32,
              fontWeight: 700,
              color: "#1a1a1a",
              fontFamily: "Poppins, sans-serif",
            }}
          >
            {total}
          </div>
          <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
            {centerLabel}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 150 }}>
        {data.map((segment, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: 12,
              fontSize: 14,
            }}
          >
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: 3,
                background: segment.color,
                marginRight: 10,
                flexShrink: 0,
              }}
            />
            <span style={{ color: "#666", flex: 1 }}>{segment.label}</span>
            <span style={{ fontWeight: 600, color: "#1a1a1a", marginLeft: 8 }}>
              {segment.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MetricCard({ label, value, color = "#00b8d4", icon, subtitle }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 12,
        padding: 20,
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        border: "1px solid #e8e8e8",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        cursor: "default",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)";
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        {icon && (
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              background: `${color}15`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
              flexShrink: 0,
            }}
          >
            {icon}
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, color: "#999", marginBottom: 4 }}>
            {label}
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: "#1a1a1a",
              fontFamily: "Poppins, sans-serif",
              lineHeight: 1.2,
            }}
          >
            {value}
          </div>
          {subtitle && (
            <div style={{ fontSize: 11, color: "#999", marginTop: 6 }}>
              {subtitle}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ProgressRing({
  percentage,
  size = 140,
  strokeWidth = 12,
  color = "#00b8d4",
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div
      style={{
        position: "relative",
        width: size,
        height: size,
        margin: "0 auto",
      }}
    >
      <svg width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#f0f0f0"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{
            transition: "stroke-dashoffset 0.6s ease",
            transform: "rotate(-90deg)",
            transformOrigin: "50% 50%",
          }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: "#1a1a1a",
            fontFamily: "Poppins, sans-serif",
          }}
        >
          {percentage}%
        </div>
      </div>
    </div>
  );
}

function DualBarChart({ data, color1 = "#00b8d4", color2 = "#00c853" }) {
  if (!data || data.length === 0) return null;

  const maxValue = Math.max(...data.map(([, v1, v2]) => Math.max(v1, v2)), 1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {data.map(([month, assigned, completed]) => {
        const assignedPercentage = (assigned / maxValue) * 100;
        const completedPercentage = (completed / maxValue) * 100;

        return (
          <div key={month}>
            <div
              style={{
                fontSize: 13,
                color: "#666",
                marginBottom: 10,
                fontWeight: 500,
              }}
            >
              {month}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div
                style={{
                  height: 28,
                  background: color1,
                  width: `${assignedPercentage}%`,
                  borderRadius: 6,
                  transition: "width 0.6s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  paddingRight: 12,
                  minWidth: assigned > 0 ? "40px" : "0",
                }}
              >
                <span style={{ fontSize: 12, color: "#fff", fontWeight: 600 }}>
                  {assigned > 0 ? assigned : ""}
                </span>
              </div>
              <div
                style={{
                  height: 28,
                  background: color2,
                  width: `${completedPercentage}%`,
                  borderRadius: 6,
                  transition: "width 0.6s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  paddingRight: 12,
                  minWidth: completed > 0 ? "40px" : "0",
                }}
              >
                <span style={{ fontSize: 12, color: "#fff", fontWeight: 600 }}>
                  {completed > 0 ? completed : ""}
                </span>
              </div>
            </div>
          </div>
        );
      })}
      <div style={{ display: "flex", gap: 20, fontSize: 13, marginTop: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 14,
              height: 14,
              background: color1,
              borderRadius: 3,
            }}
          />
          <span style={{ color: "#666" }}>Assigned</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 14,
              height: 14,
              background: color2,
              borderRadius: 3,
            }}
          />
          <span style={{ color: "#666" }}>Completed</span>
        </div>
      </div>
    </div>
  );
}

/* =========================
   HELPERS
========================= */

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

    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      "0"
    )}`;

    map[key] = (map[key] || 0) + 1;
  });

  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6);
};

/* =========================
   EMPLOYEE INSIGHTS PAGE
========================= */

function EmployeeInsightsPage() {
  const [tasks, setTasks] = useState([]);
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
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === "Done").length;
    const overdue = tasks.filter((t) => isOverdue(t)).length;
    const pending = total - completed;

    return {
      total,
      completed,
      pending,
      overdue,
      completionRate: total ? Math.round((completed / total) * 100) : 0,
      onTimeRate:
        completed > 0
          ? Math.round(((completed - overdue) / completed) * 100)
          : 0,
    };
  }, [tasks]);

  const completedMonthly = useMemo(
    () =>
      buildMonthlySeries(
        tasks.filter((t) => t.completedAt),
        "completedAt"
      ),
    [tasks]
  );

  const createdMonthly = useMemo(
    () => buildMonthlySeries(tasks, "createdAt"),
    [tasks]
  );

  const assignedVsCompleted = useMemo(() => {
    const createdMap = {};
    const completedMap = {};

    createdMonthly.forEach(([month, count]) => {
      createdMap[month] = count;
    });

    completedMonthly.forEach(([month, count]) => {
      completedMap[month] = count;
    });

    const allMonths = [
      ...new Set([
        ...createdMonthly.map(([m]) => m),
        ...completedMonthly.map(([m]) => m),
      ]),
    ].sort();

    return allMonths.map((month) => [
      month,
      createdMap[month] || 0,
      completedMap[month] || 0,
    ]);
  }, [createdMonthly, completedMonthly]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#faf9f7",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Poppins, sans-serif",
        }}
      >
        <div style={{ fontSize: 16, color: "#999" }}>Loading insights...</div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#faf9f7",
        fontFamily: "Poppins, sans-serif",
      }}
    >
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "40px 20px" }}>
        <div style={{ marginBottom: 32 }}>
          <h1
            style={{
              margin: 0,
              fontSize: 32,
              fontWeight: 700,
              color: "#1a1a1a",
            }}
          >
            My Insights
          </h1>
          <p style={{ margin: "8px 0 0", color: "#666", fontSize: 14 }}>
            Your personal productivity overview
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 20,
            marginBottom: 32,
          }}
        >
          <MetricCard
            label="Total Tasks"
            value={metrics.total}
            color="#00b8d4"
            icon="📋"
          />
          <MetricCard
            label="Completed"
            value={metrics.completed}
            color="#00c853"
            icon="✓"
            subtitle={`${metrics.completionRate}% completion rate`}
          />
          <MetricCard
            label="Pending"
            value={metrics.pending}
            color="#ff9800"
            icon="⏳"
          />
          <MetricCard
            label="Overdue"
            value={metrics.overdue}
            color="#f44336"
            icon="⚠"
          />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 24,
            marginBottom: 32,
          }}
        >
          <ChartCard title="Completion Rate" isEmpty={metrics.total === 0}>
            <div style={{ textAlign: "center", paddingTop: 12 }}>
              <ProgressRing
                percentage={metrics.completionRate}
                color="#00c853"
              />
              <p style={{ marginTop: 20, marginBottom: 0, color: "#666", fontSize: 14 }}>
                {metrics.completed} of {metrics.total} tasks completed
              </p>
            </div>
          </ChartCard>

          <ChartCard
            title="On-Time Performance"
            isEmpty={metrics.completed === 0}
          >
            <div style={{ textAlign: "center", paddingTop: 12 }}>
              <ProgressRing percentage={metrics.onTimeRate} color="#00b8d4" />
              <p style={{ marginTop: 20, marginBottom: 0, color: "#666", fontSize: 14 }}>
                {metrics.completed - metrics.overdue} completed on time
              </p>
            </div>
          </ChartCard>

          <ChartCard title="Task Status" isEmpty={metrics.total === 0}>
            <DonutChart
              data={[
                {
                  label: "Completed",
                  value: metrics.completed,
                  color: "#00c853",
                },
                { label: "Pending", value: metrics.pending, color: "#ff9800" },
                { label: "Overdue", value: metrics.overdue, color: "#f44336" },
              ]}
              total={metrics.total}
              centerLabel="Total"
            />
          </ChartCard>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: 24,
          }}
        >
          <ChartCard
            title="Assigned vs Completed (Last 6 Months)"
            isEmpty={assignedVsCompleted.length === 0}
          >
            <DualBarChart
              data={assignedVsCompleted}
              color1="#00b8d4"
              color2="#00c853"
            />
          </ChartCard>
        </div>
      </div>
    </div>
  );
}

export default EmployeeInsightsPage;