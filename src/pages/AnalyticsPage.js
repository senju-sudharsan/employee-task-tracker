import { useEffect, useMemo, useState } from "react";
import { auth } from "../firebase";

import {
  getTasksByOrganization,
  getTasksByEmployee,
  getEmployeesByOrganization,
} from "../services/taskService";

import { getAllOrganizations } from "../services/organizationService";

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
    <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
      <div style={{ position: "relative", width: 180, height: 180 }}>
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

      <div style={{ flex: 1 }}>
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
              }}
            />
            <span style={{ color: "#666", flex: 1 }}>{segment.label}</span>
            <span style={{ fontWeight: 600, color: "#1a1a1a" }}>
              {segment.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BarBreakdown({ items, valueKey, labelKey, color = "#00b8d4" }) {
  if (!items || items.length === 0) return null;

  const maxValue = Math.max(...items.map((item) => item[valueKey]), 1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {items.map((item, i) => {
        const percentage = (item[valueKey] / maxValue) * 100;

        return (
          <div key={i}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 6,
                fontSize: 13,
              }}
            >
              <span style={{ color: "#666", fontWeight: 500 }}>
                {item[labelKey]}
              </span>
              <span style={{ color: "#1a1a1a", fontWeight: 600 }}>
                {item[valueKey]}
              </span>
            </div>
            <div
              style={{
                height: 8,
                background: "#f0f0f0",
                borderRadius: 4,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  background: color,
                  width: `${percentage}%`,
                  transition: "width 0.6s ease",
                  borderRadius: 4,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MetricCard({ label, value, color = "#00b8d4", icon }) {
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
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
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
            }}
          >
            {icon}
          </div>
        )}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, color: "#999", marginBottom: 4 }}>
            {label}
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: "#1a1a1a",
              fontFamily: "Poppins, sans-serif",
            }}
          >
            {value}
          </div>
        </div>
      </div>
    </div>
  );
}

function DualBarChart({ data, color1 = "#00b8d4", color2 = "#00c853" }) {
  if (!data || data.length === 0) return null;

  const maxValue = Math.max(
    ...data.map(([, v1, v2]) => Math.max(v1, v2)),
    1
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {data.map(([month, created, completed]) => {
        const createdPercentage = (created / maxValue) * 100;
        const completedPercentage = (completed / maxValue) * 100;

        return (
          <div key={month}>
            <div
              style={{
                fontSize: 12,
                color: "#666",
                marginBottom: 8,
                fontWeight: 500,
              }}
            >
              {month}
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
                  <div
                    style={{
                      height: 24,
                      background: color1,
                      width: `${createdPercentage}%`,
                      borderRadius: 4,
                      transition: "width 0.6s ease",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "flex-end",
                      paddingRight: 8,
                    }}
                  >
                    <span style={{ fontSize: 11, color: "#fff", fontWeight: 600 }}>
                      {created > 0 ? created : ""}
                    </span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  <div
                    style={{
                      height: 24,
                      background: color2,
                      width: `${completedPercentage}%`,
                      borderRadius: 4,
                      transition: "width 0.6s ease",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "flex-end",
                      paddingRight: 8,
                    }}
                  >
                    <span style={{ fontSize: 11, color: "#fff", fontWeight: 600 }}>
                      {completed > 0 ? completed : ""}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
      <div style={{ display: "flex", gap: 16, fontSize: 12, marginTop: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div
            style={{
              width: 12,
              height: 12,
              background: color1,
              borderRadius: 2,
            }}
          />
          <span style={{ color: "#666" }}>Created</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div
            style={{
              width: 12,
              height: 12,
              background: color2,
              borderRadius: 2,
            }}
          />
          <span style={{ color: "#666" }}>Completed</span>
        </div>
      </div>
    </div>
  );
}

function GroupedBarChart({ items, color1 = "#00c853", color2 = "#ff9800", color3 = "#f44336" }) {
  if (!items || items.length === 0) return null;

  const maxValue = Math.max(
    ...items.map((item) => Math.max(item.completed, item.pending, item.overdue)),
    1
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {items.map((item, i) => {
        const completedPct = (item.completed / maxValue) * 100;
        const pendingPct = (item.pending / maxValue) * 100;
        const overduePct = (item.overdue / maxValue) * 100;

        return (
          <div key={i}>
            <div
              style={{
                fontSize: 13,
                color: "#666",
                marginBottom: 8,
                fontWeight: 500,
              }}
            >
              {item.name}
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              <div
                style={{
                  height: 20,
                  background: color1,
                  width: `${completedPct}%`,
                  borderRadius: 3,
                  transition: "width 0.6s ease",
                }}
                title={`Completed: ${item.completed}`}
              />
              <div
                style={{
                  height: 20,
                  background: color2,
                  width: `${pendingPct}%`,
                  borderRadius: 3,
                  transition: "width 0.6s ease",
                }}
                title={`Pending: ${item.pending}`}
              />
              <div
                style={{
                  height: 20,
                  background: color3,
                  width: `${overduePct}%`,
                  borderRadius: 3,
                  transition: "width 0.6s ease",
                }}
                title={`Overdue: ${item.overdue}`}
              />
            </div>
            <div style={{ display: "flex", gap: 12, fontSize: 11, marginTop: 6, color: "#999" }}>
              <span>C: {item.completed}</span>
              <span>P: {item.pending}</span>
              <span>O: {item.overdue}</span>
            </div>
          </div>
        );
      })}
      <div style={{ display: "flex", gap: 12, fontSize: 11, marginTop: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <div style={{ width: 10, height: 10, background: color1, borderRadius: 2 }} />
          <span style={{ color: "#666" }}>Completed</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <div style={{ width: 10, height: 10, background: color2, borderRadius: 2 }} />
          <span style={{ color: "#666" }}>Pending</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <div style={{ width: 10, height: 10, background: color3, borderRadius: 2 }} />
          <span style={{ color: "#666" }}>Overdue</span>
        </div>
      </div>
    </div>
  );
}

function RankedBarChart({ items, labelKey, valueKey, color = "#00b8d4" }) {
  if (!items || items.length === 0) return null;

  const maxValue = Math.max(...items.map((item) => item[valueKey]), 1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {items.map((item, i) => {
        const percentage = (item[valueKey] / maxValue) * 100;
        const width = item[valueKey] > 0 ? percentage : 0;

        return (
          <div key={i}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 6,
                fontSize: 12,
              }}
            >
              <span style={{ color: "#666", fontWeight: 500 }}>
                {item[labelKey]}
              </span>
              <span style={{ color: "#1a1a1a", fontWeight: 600 }}>
                {item[valueKey]}%
              </span>
            </div>
            <div
              style={{
                height: 8,
                background: "#f0f0f0",
                borderRadius: 4,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  background: color,
                  width: `${width}%`,
                  transition: "width 0.6s ease",
                  borderRadius: 4,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* =========================
   PURE HELPERS
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
   ANALYTICS PAGE
========================= */

function AnalyticsPage({ role, organizationId, currentUser }) {
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrgId, setSelectedOrgId] = useState("all");

  useEffect(() => {
    const loadAnalytics = async () => {
      setLoading(true);

      try {
        if (role === "super_admin") {
          const orgs = await getAllOrganizations();
          setOrganizations(orgs);

          let allTasks = [];
          let allEmployees = [];

          for (const org of orgs) {
            const orgTasks = await getTasksByOrganization(org.id);
            const orgEmployees = await getEmployeesByOrganization(org.id);

            allTasks = allTasks.concat(
              (orgTasks || []).map((t) => ({ ...t, orgId: org.id, orgName: org.name }))
            );
            allEmployees = allEmployees.concat(orgEmployees || []);
          }

          setTasks(allTasks);
          setEmployees(allEmployees);
        } else if (role === "admin" && organizationId) {
          const [taskData, employeeData] = await Promise.all([
            getTasksByOrganization(organizationId),
            getEmployeesByOrganization(organizationId),
          ]);

          setTasks(taskData || []);
          setEmployees(employeeData || []);
        } else if (role === "employee" && auth.currentUser) {
          const taskData = await getTasksByEmployee(auth.currentUser.uid);
          setTasks(taskData || []);
          setEmployees([]);
        }
      } catch (err) {
        console.error("Failed to load analytics:", err);
      }

      setLoading(false);
    };

    loadAnalytics();
  }, [role, organizationId]);

  const filteredTasks = useMemo(() => {
    if (role !== "super_admin" || selectedOrgId === "all") {
      return tasks;
    }
    return tasks.filter((t) => t.orgId === selectedOrgId);
  }, [tasks, selectedOrgId, role]);

  const metrics = useMemo(
    () => ({
      total: filteredTasks.length,
      pending: filteredTasks.filter((t) => t.status !== "Done").length,
      completed: filteredTasks.filter((t) => t.status === "Done").length,
      overdue: filteredTasks.filter((t) => isOverdue(t)).length,
    }),
    [filteredTasks]
  );

  const createdMonthly = useMemo(
    () => buildMonthlySeries(filteredTasks, "createdAt"),
    [filteredTasks]
  );

  const completedMonthly = useMemo(
    () => buildMonthlySeries(filteredTasks, "completedAt"),
    [filteredTasks]
  );

  const workloadBalance = useMemo(() => {
    const createdMap = {};
    const completedMap = {};

    createdMonthly.forEach(([month, count]) => {
      createdMap[month] = count;
    });

    completedMonthly.forEach(([month, count]) => {
      completedMap[month] = count;
    });

    const allMonths = [
      ...new Set([...createdMonthly.map(([m]) => m), ...completedMonthly.map(([m]) => m)]),
    ].sort();

    return allMonths.map((month) => [
      month,
      createdMap[month] || 0,
      completedMap[month] || 0,
    ]);
  }, [createdMonthly, completedMonthly]);

  const orgComparison = useMemo(() => {
    if (role !== "super_admin") return [];

    const orgMap = {};

    tasks.forEach((t) => {
      const orgName = t.orgName || "Unknown";
      if (!orgMap[orgName]) {
        orgMap[orgName] = { name: orgName, completed: 0, pending: 0, overdue: 0, total: 0 };
      }

      orgMap[orgName].total += 1;
      if (t.status === "Done") {
        orgMap[orgName].completed += 1;
      } else {
        orgMap[orgName].pending += 1;
      }
      if (isOverdue(t)) {
        orgMap[orgName].overdue += 1;
      }
    });

    return Object.values(orgMap);
  }, [tasks, role]);

  const orgCompletionRates = useMemo(() => {
    return orgComparison
      .map((org) => ({
        name: org.name,
        completionRate: org.total > 0 ? Math.round((org.completed / org.total) * 100) : 0,
      }))
      .sort((a, b) => b.completionRate - a.completionRate);
  }, [orgComparison]);

  const teamWorkload = useMemo(() => {
    return employees
      .map((e) => ({
        name: e.name || e.email || "Unknown",
        taskCount: filteredTasks.filter((t) => t.assignedTo === e.uid).length,
      }))
      .sort((a, b) => b.taskCount - a.taskCount)
      .slice(0, 8);
  }, [employees, filteredTasks]);

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
        <div style={{ fontSize: 16, color: "#999" }}>Loading analytics...</div>
      </div>
    );
  }

  const displayName = currentUser?.name || currentUser?.email || "User";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#faf9f7",
        fontFamily: "Poppins, sans-serif",
      }}
    >
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: 40 }}>
        <div style={{ marginBottom: 32, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: 32,
                fontWeight: 700,
                color: "#1a1a1a",
              }}
            >
              Analytics
            </h1>
            <p style={{ margin: "8px 0 0", color: "#666", fontSize: 14 }}>
              Welcome back, {displayName}
            </p>
          </div>

          {role === "super_admin" && organizations.length > 0 && (
            <div>
              <select
                value={selectedOrgId}
                onChange={(e) => setSelectedOrgId(e.target.value)}
                style={{
                  padding: "10px 16px",
                  borderRadius: 8,
                  border: "1px solid #e8e8e8",
                  background: "#fff",
                  fontSize: 14,
                  fontFamily: "Poppins, sans-serif",
                  color: "#1a1a1a",
                  cursor: "pointer",
                  outline: "none",
                }}
              >
                <option value="all">All Organizations</option>
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
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
            gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
            gap: 24,
            marginBottom: 32,
          }}
        >
          <ChartCard title="Task Distribution" isEmpty={metrics.total === 0}>
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

          <ChartCard
            title="Workload Balance (Created vs Completed)"
            isEmpty={workloadBalance.length === 0}
          >
            <DualBarChart data={workloadBalance} color1="#00b8d4" color2="#00c853" />
          </ChartCard>
        </div>

        {role === "super_admin" && (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
                gap: 24,
                marginBottom: 32,
              }}
            >
              <ChartCard
                title="Tasks by Organization"
                isEmpty={orgComparison.length === 0}
              >
                <GroupedBarChart items={orgComparison} />
              </ChartCard>

              <ChartCard
                title="Completion Rate by Organization"
                isEmpty={orgCompletionRates.length === 0}
              >
                <RankedBarChart
                  items={orgCompletionRates}
                  labelKey="name"
                  valueKey="completionRate"
                  color="#00b8d4"
                />
              </ChartCard>
            </div>
          </>
        )}

        {(role === "admin" || role === "super_admin") && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr",
              gap: 24,
            }}
          >
            <ChartCard title="Team Workload" isEmpty={teamWorkload.length === 0}>
              <BarBreakdown
                items={teamWorkload}
                valueKey="taskCount"
                labelKey="name"
                color="#00b8d4"
              />
            </ChartCard>
          </div>
        )}
      </div>
    </div>
  );
}

export default AnalyticsPage;