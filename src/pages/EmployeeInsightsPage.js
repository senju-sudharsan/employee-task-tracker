import { useEffect, useMemo, useState } from "react";
import { auth } from "../firebase";

import { getTasksByEmployee } from "../services/taskService";

function EmployeeInsightsPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  /* =====================
     LOAD DATA
  ===================== */
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

  /* =====================
     HELPERS
  ===================== */
  const isOverdue = (task) => {
    if (!task.deadline || task.status === "Done") return false;

    const d =
      typeof task.deadline?.toDate === "function"
        ? task.deadline.toDate()
        : new Date(task.deadline);

    return d < new Date();
  };

  const buildMonthlySeries = (items, dateKey) => {
    const map = {};

    items.forEach((t) => {
      if (!t[dateKey]) return;

      const d =
        typeof t[dateKey]?.toDate === "function"
          ? t[dateKey].toDate()
          : new Date(t[dateKey]);

      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      map[key] = (map[key] || 0) + 1;
    });

    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6); // last 6 months
  };

  /* =====================
     METRICS
  ===================== */
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
          ? Math.round(
              ((completed - overdue) / completed) * 100
            )
          : 0,
    };
  }, [tasks]);

  /* =====================
     TRENDS
  ===================== */
  const completedMonthly = useMemo(
    () => buildMonthlySeries(tasks.filter((t) => t.completedAt), "completedAt"),
    [tasks]
  );

  const createdMonthly = useMemo(
    () => buildMonthlySeries(tasks, "createdAt"),
    [tasks]
  );

  /* =====================
     UI (TEMPORARY / LOGIC VIEW)
  ===================== */
  if (loading) {
    return <div style={{ padding: 40 }}>Loading insights…</div>;
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>My Insights</h1>

      <section style={{ marginTop: 24 }}>
        <h3>Overview</h3>
        <p>Total tasks: {metrics.total}</p>
        <p>Completed: {metrics.completed}</p>
        <p>Pending: {metrics.pending}</p>
        <p>Overdue: {metrics.overdue}</p>
        <p>Completion rate: {metrics.completionRate}%</p>
        <p>On-time completion: {metrics.onTimeRate}%</p>
      </section>

      <section style={{ marginTop: 32 }}>
        <h3>Tasks Completed (Last 6 Months)</h3>
        {completedMonthly.length === 0 ? (
          <p>No completed tasks yet</p>
        ) : (
          completedMonthly.map(([month, count]) => (
            <div key={month}>
              {month}: {count}
            </div>
          ))
        )}
      </section>

      <section style={{ marginTop: 32 }}>
        <h3>Tasks Created (Last 6 Months)</h3>
        {createdMonthly.length === 0 ? (
          <p>No task creation data</p>
        ) : (
          createdMonthly.map(([month, count]) => (
            <div key={month}>
              {month}: {count}
            </div>
          ))
        )}
      </section>
    </div>
  );
}

export default EmployeeInsightsPage;
