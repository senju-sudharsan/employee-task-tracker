import { useEffect, useMemo, useState, useRef } from "react";
import {
  Search,
  Users,
  ClipboardList,
  CheckCircle2,
  Clock3,
  AlertTriangle,
  Loader2,
  ChevronDown,
  X,
  Filter,
} from "lucide-react";
import {
  getEmployeesByOrganization,
  getTasksByEmployee,
} from "../services/taskService";

/* ─────────────────────────────────────────
   DESIGN TOKENS
───────────────────────────────────────── */
const T = {
  pageBg: "#F0EDE8",
  surface: "#FFFFFF",
  border: "#E2DBD1",
  borderStrong: "#C9B89A",
  text: "#18120A",
  muted: "#6B6059",
  subtle: "#9E958C",
  amber: "#C98A1A",
  amberLight: "#FEF3C7",
  font: "-apple-system, 'Helvetica Neue', Arial, sans-serif",
};

const PRIORITY = {
  high:   { label: "High",   color: "#A32D2D", bg: "#FEF2F2", border: "#FECACA", dot: "#EF4444" },
  medium: { label: "Medium", color: "#92400E", bg: "#FFFBEB", border: "#FDE68A", dot: "#F59E0B" },
  low:    { label: "Low",    color: "#1E40AF", bg: "#EFF6FF", border: "#BFDBFE", dot: "#3B82F6" },
};

const STATUS = {
  "To Do":       { label: "To Do",       color: "#374151", bg: "#F9FAFB", border: "#E5E7EB", dot: "#9CA3AF" },
  "In Progress": { label: "In Progress", color: "#1D4ED8", bg: "#EFF6FF", border: "#BFDBFE", dot: "#3B82F6" },
  "Done":        { label: "Done",        color: "#15803D", bg: "#F0FDF4", border: "#BBF7D0", dot: "#22C55E" },
};

const STATS = [
  { key: "total",   label: "Total Tasks",    Icon: ClipboardList, accent: "#78350F", accentBg: "#FEF3C7" },
  { key: "done",    label: "Completed",      Icon: CheckCircle2,  accent: "#14532D", accentBg: "#DCFCE7" },
  { key: "pending", label: "Pending",        Icon: Clock3,        accent: "#1E3A8A", accentBg: "#DBEAFE" },
  { key: "high",    label: "High Priority",  Icon: AlertTriangle, accent: "#7F1D1D", accentBg: "#FEE2E2" },
];

/* ─────────────────────────────────────────
   PILL BADGE
───────────────────────────────────────── */
function Badge({ label, color, bg, border, dot }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 10px", borderRadius: 999,
      fontSize: 11, fontWeight: 600, letterSpacing: "0.02em",
      color, background: bg, border: `1px solid ${border}`,
      whiteSpace: "nowrap", flexShrink: 0,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: dot }} />
      {label}
    </span>
  );
}

/* ─────────────────────────────────────────
   SEARCHABLE SELECT
───────────────────────────────────────── */
function SearchableSelect({ options, value, onChange, placeholder, loading }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapRef = useRef(null);
  const inputRef = useRef(null);
  const selected = options.find((o) => o.value === value);

  const filtered = useMemo(() => {
    if (!query.trim()) return options;
    const q = query.toLowerCase();
    return options.filter(o =>
      o.label.toLowerCase().includes(q) || (o.sub && o.sub.toLowerCase().includes(q))
    );
  }, [options, query]);

  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false); setQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleOpen = () => {
    if (loading) return;
    setOpen(true); setQuery("");
    setTimeout(() => inputRef.current?.focus(), 50);
  };
  const handleSelect = (opt) => { onChange(opt.value); setOpen(false); setQuery(""); };
  const handleClear = (e) => { e.stopPropagation(); onChange(""); setOpen(false); setQuery(""); };

  return (
    <div ref={wrapRef} style={{ position: "relative", width: "100%" }}>
      <div
        onClick={handleOpen}
        style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "0 14px", height: 40,
          borderRadius: 8,
          border: `1px solid ${open ? T.amber : T.border}`,
          background: "#FAFAF8",
          cursor: loading ? "default" : "pointer",
          outline: open ? `2px solid ${T.amber}22` : "none",
          outlineOffset: 2,
          transition: "border-color .15s, outline .15s",
          userSelect: "none",
        }}
      >
        <Users size={13} color={T.subtle} />
        <span style={{
          flex: 1, fontSize: 13.5, fontWeight: selected ? 500 : 400,
          color: selected ? T.text : T.subtle,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {loading ? "Loading…" : selected ? selected.label : placeholder}
        </span>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          {selected && !loading && (
            <button onClick={handleClear} style={{
              background: "none", border: "none", cursor: "pointer",
              padding: 2, color: T.subtle, display: "flex", alignItems: "center",
            }}>
              <X size={11} />
            </button>
          )}
          {loading
            ? <Loader2 size={13} color={T.subtle} style={{ animation: "spin 1s linear infinite" }} />
            : <ChevronDown size={13} color={T.subtle} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .15s" }} />
          }
        </div>
      </div>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0,
          zIndex: 9999, background: "#FDFCFA",
          borderRadius: 10, border: `1px solid ${T.border}`,
          boxShadow: "0 8px 24px rgba(0,0,0,.10), 0 2px 6px rgba(0,0,0,.06)",
          overflow: "hidden",
        }}>
          <div style={{
            padding: "8px 12px", borderBottom: `1px solid ${T.border}`,
            display: "flex", alignItems: "center", gap: 8, background: "#F9F8F6",
          }}>
            <Search size={12} color={T.subtle} />
            <input
              ref={inputRef} value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter employees…"
              style={{
                flex: 1, border: "none", outline: "none",
                fontSize: 13, color: T.text, background: "transparent",
                fontFamily: T.font,
              }}
            />
          </div>
          <div style={{ maxHeight: 240, overflowY: "auto" }}>
            {filtered.length === 0 ? (
              <div style={{ padding: "16px", textAlign: "center", fontSize: 13, color: T.subtle }}>
                No results
              </div>
            ) : filtered.map((opt) => {
              const isSel = opt.value === value;
              return (
                <div key={opt.value} onClick={() => handleSelect(opt)} style={{
                  padding: "9px 14px", cursor: "pointer",
                  background: isSel ? T.amberLight : "transparent",
                  borderLeft: `2px solid ${isSel ? T.amber : "transparent"}`,
                  transition: "background .1s",
                }}
                  onMouseEnter={(e) => { if (!isSel) e.currentTarget.style.background = "#F5F0E8"; }}
                  onMouseLeave={(e) => { if (!isSel) e.currentTarget.style.background = "transparent"; }}
                >
                  <div style={{ fontSize: 13, fontWeight: 500, color: isSel ? "#92400E" : T.text }}>{opt.label}</div>
                  {opt.sub && <div style={{ fontSize: 11, color: T.muted, marginTop: 1 }}>{opt.sub}</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────
   STAT CARD
───────────────────────────────────────── */
function StatCard({ Icon, label, value, accent, accentBg }) {
  return (
    <div style={{
      background: "#FFFFFF",
      border: `1px solid ${T.border}`,
      borderRadius: 12,
      padding: "18px 20px",
      display: "flex", alignItems: "flex-start", justifyContent: "space-between",
    }}>
      <div>
        <div style={{ fontSize: 11.5, fontWeight: 600, color: T.muted, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>
          {label}
        </div>
        <div style={{ fontSize: 28, fontWeight: 700, color: T.text, letterSpacing: "-0.03em", lineHeight: 1 }}>
          {value}
        </div>
      </div>
      <div style={{
        width: 36, height: 36, borderRadius: 8,
        background: accentBg,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <Icon size={16} color={accent} strokeWidth={2} />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   TASK ROW
───────────────────────────────────────── */
function TaskRow({ task, formatDate, isLast }) {
  const priority = (task.priority || "low").toLowerCase();
  const pc = PRIORITY[priority] || PRIORITY.low;
  const sc = STATUS[task.status] || STATUS["To Do"];

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "1fr 110px 100px 90px 90px",
      alignItems: "center",
      gap: 16,
      padding: "14px 20px",
      borderBottom: isLast ? "none" : `1px solid ${T.border}`,
      transition: "background .12s",
    }}
      onMouseEnter={(e) => e.currentTarget.style.background = "#FAFAF8"}
      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
    >
      {/* Title + description */}
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: T.text, marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {task.title}
        </div>
        <div style={{ fontSize: 12, color: T.subtle, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {task.description || "—"}
        </div>
      </div>

      {/* Status */}
      <div><Badge {...sc} label={sc.label} /></div>

      {/* Priority */}
      <div><Badge {...pc} label={pc.label} /></div>

      {/* Deadline */}
      <div style={{ fontSize: 12, color: T.muted }}>
        {formatDate(task.deadline)}
      </div>

      {/* Created */}
      <div style={{ fontSize: 12, color: T.muted }}>
        {formatDate(task.createdAt)}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   EMPTY STATE
───────────────────────────────────────── */
function EmptyState({ icon: Icon, title, sub }) {
  return (
    <div style={{ padding: "60px 24px", textAlign: "center" }}>
      <div style={{
        width: 48, height: 48, borderRadius: 12,
        background: "#F5F0E8",
        display: "flex", alignItems: "center", justifyContent: "center",
        margin: "0 auto 12px", color: T.subtle,
      }}>
        <Icon size={20} />
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: T.muted, marginBottom: 4 }}>{title}</div>
      {sub && <div style={{ fontSize: 12.5, color: T.subtle }}>{sub}</div>}
    </div>
  );
}

/* ─────────────────────────────────────────
   MAIN
───────────────────────────────────────── */
function EmployeeTaskViewer({ currentUser }) {
  const [employees, setEmployees]             = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [tasks, setTasks]                     = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [loadingTasks, setLoadingTasks]       = useState(false);
  const [search, setSearch]                   = useState("");
  const [statusFilter, setStatusFilter]       = useState("all");
  const [employeeError, setEmployeeError]     = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoadingEmployees(true); setEmployeeError(null);
        const orgId = currentUser?.organizationId || currentUser?.uid;
        if (!orgId) { setEmployeeError("Could not determine organization."); return; }
        const data = await getEmployeesByOrganization(orgId);
        setEmployees([...data].sort((a, b) => (a.name || "").localeCompare(b.name || "")));
      } catch { setEmployeeError("Failed to load employees."); }
      finally { setLoadingEmployees(false); }
    };
    load();
  }, [currentUser]);

  useEffect(() => {
    const load = async () => {
      if (!selectedEmployee) { setTasks([]); return; }
      try {
        setLoadingTasks(true);
        const data = await getTasksByEmployee(selectedEmployee);
        setTasks([...data].sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
      } catch { }
      finally { setLoadingTasks(false); }
    };
    load();
  }, [selectedEmployee]);

  const filteredTasks = useMemo(() => tasks.filter((task) => {
    const q = search.toLowerCase();
    const matchSearch = task.title?.toLowerCase().includes(q) || task.description?.toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || task.status === statusFilter;
    return matchSearch && matchStatus;
  }), [tasks, search, statusFilter]);

  const stats = useMemo(() => ({
    total:   tasks.length,
    done:    tasks.filter(t => t.status === "Done").length,
    pending: tasks.filter(t => t.status !== "Done").length,
    high:    tasks.filter(t => t.priority === "high").length,
  }), [tasks]);

  const selectedEmp = employees.find(e => e.uid === selectedEmployee);

  const formatDate = (raw) => {
    if (!raw) return "—";
    try {
      if (raw?.toDate) return raw.toDate().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      if (raw?.seconds) return new Date(raw.seconds * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      return new Date(raw).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch { return "—"; }
  };

  const employeeOptions = employees.map(emp => ({
    value: emp.uid, label: emp.name, sub: emp.email,
  }));

  const completionPct = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #D1C4B0; border-radius: 999px; }
      `}</style>

      <div style={{ width: "100%", minHeight: "100%", fontFamily: T.font, color: T.text, padding: "28px 32px 40px" }}>

        {/* ── PAGE HEADER ── */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: T.text, letterSpacing: "-0.03em" }}>
              Task Monitor
            </h1>
            {selectedEmp && (
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "6px 14px", borderRadius: 999,
                background: T.amberLight, border: `1px solid #FDE68A`,
                animation: "fadeIn .2s ease both",
              }}>
                <div style={{
                  width: 22, height: 22, borderRadius: "50%",
                  background: T.amber, color: "#fff",
                  fontSize: 10, fontWeight: 700,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {(selectedEmp.name || "?")[0].toUpperCase()}
                </div>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: "#92400E" }}>{selectedEmp.name}</span>
                <span style={{ fontSize: 12, color: "#B45309" }}>{selectedEmp.email}</span>
              </div>
            )}
          </div>
          <p style={{ fontSize: 13, color: T.subtle }}>Monitor and inspect tasks across your organization.</p>
        </div>

        {/* ── FILTER BAR ── */}
        <div style={{
          background: "#FFFFFF",
          border: `1px solid ${T.border}`,
          borderRadius: 12,
          padding: "14px 18px",
          marginBottom: 20,
          display: "grid",
          gridTemplateColumns: "1fr 1fr 180px",
          gap: 12,
          alignItems: "end",
          position: "relative",
          zIndex: 50,
        }}>
          <div>
            <label style={labelSt}>Employee</label>
            <SearchableSelect
              options={employeeOptions}
              value={selectedEmployee}
              onChange={setSelectedEmployee}
              placeholder="Select employee…"
              loading={loadingEmployees}
            />
            {employeeError && <div style={{ fontSize: 11, color: "#B91C1C", marginTop: 4 }}>⚠ {employeeError}</div>}
          </div>

          <div>
            <label style={labelSt}>Search tasks</label>
            <div style={{ position: "relative" }}>
              <Search size={13} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: T.subtle, pointerEvents: "none" }} />
              <input
                value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title or description…"
                style={{
                  width: "100%", height: 40,
                  padding: "0 12px 0 34px",
                  borderRadius: 8, border: `1px solid ${T.border}`,
                  fontSize: 13.5, outline: "none",
                  background: "#FAFAF8", color: T.text, fontFamily: T.font,
                  transition: "border-color .15s",
                }}
                onFocus={(e) => { e.target.style.borderColor = T.amber; e.target.style.outline = `2px solid ${T.amber}22`; e.target.style.outlineOffset = "2px"; }}
                onBlur={(e) => { e.target.style.borderColor = T.border; e.target.style.outline = "none"; }}
              />
            </div>
          </div>

          <div>
            <label style={labelSt}>Status</label>
            <div style={{ position: "relative" }}>
              <Filter size={12} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: T.subtle, pointerEvents: "none" }} />
              <select
                value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  width: "100%", height: 40,
                  padding: "0 32px 0 32px",
                  borderRadius: 8, border: `1px solid ${T.border}`,
                  fontSize: 13.5, outline: "none",
                  background: "#FAFAF8", color: T.text, fontFamily: T.font,
                  cursor: "pointer", appearance: "none",
                  transition: "border-color .15s",
                }}
                onFocus={(e) => e.target.style.borderColor = T.amber}
                onBlur={(e) => e.target.style.borderColor = T.border}
              >
                <option value="all">All statuses</option>
                <option value="To Do">To Do</option>
                <option value="In Progress">In Progress</option>
                <option value="Done">Done</option>
              </select>
              <ChevronDown size={12} color={T.subtle} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
            </div>
          </div>
        </div>

        {/* ── KPI STRIP ── */}
        {selectedEmployee && (
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
            gap: 12, marginBottom: 20,
            animation: "fadeIn .25s ease both",
          }}>
            {STATS.map(s => (
              <StatCard key={s.key} Icon={s.Icon} label={s.label} value={stats[s.key]} accent={s.accent} accentBg={s.accentBg} />
            ))}
          </div>
        )}

        {/* ── PROGRESS BAR (when employee selected) ── */}
        {selectedEmployee && stats.total > 0 && (
          <div style={{
            background: "#FFFFFF", border: `1px solid ${T.border}`,
            borderRadius: 12, padding: "14px 20px",
            marginBottom: 20, display: "flex", alignItems: "center", gap: 16,
            animation: "fadeIn .25s .05s ease both",
          }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.muted, whiteSpace: "nowrap" }}>
              Completion
            </div>
            <div style={{ flex: 1, height: 6, background: "#F0EDE8", borderRadius: 999, overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 999,
                width: `${completionPct}%`,
                background: completionPct === 100 ? "#22C55E" : T.amber,
                transition: "width .6s ease",
              }} />
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text, minWidth: 36, textAlign: "right" }}>
              {completionPct}%
            </div>
            <div style={{ fontSize: 12, color: T.subtle, whiteSpace: "nowrap" }}>
              {stats.done} of {stats.total} done
            </div>
          </div>
        )}

        {/* ── TASK TABLE ── */}
        <div style={{
          background: "#FFFFFF", border: `1px solid ${T.border}`,
          borderRadius: 12, overflow: "hidden",
          animation: "fadeIn .3s .08s ease both",
        }}>
          {/* Table header */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 110px 100px 90px 90px",
            gap: 16, padding: "10px 20px",
            borderBottom: `1px solid ${T.border}`,
            background: "#FAFAF8",
          }}>
            {["Task", "Status", "Priority", "Deadline", "Created"].map((h) => (
              <div key={h} style={{ fontSize: 11, fontWeight: 700, color: T.subtle, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                {h}
              </div>
            ))}
          </div>

          {/* Table body */}
          {!selectedEmployee ? (
            <EmptyState icon={Users} title="No employee selected" sub="Use the filter above to choose an employee" />
          ) : loadingTasks ? (
            <EmptyState icon={Loader2} title="Loading tasks…" sub="Fetching from the server" />
          ) : filteredTasks.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="No tasks found"
              sub={search || statusFilter !== "all" ? "Try adjusting your filters" : "This employee has no tasks assigned"}
            />
          ) : (
            <div>
              {filteredTasks.map((task, i) => (
                <div key={task.id} style={{ animation: `fadeIn .2s ${i * 0.03}s ease both` }}>
                  <TaskRow task={task} formatDate={formatDate} isLast={i === filteredTasks.length - 1} />
                </div>
              ))}
            </div>
          )}

          {/* Table footer */}
          {selectedEmployee && !loadingTasks && filteredTasks.length > 0 && (
            <div style={{
              padding: "10px 20px", borderTop: `1px solid ${T.border}`,
              background: "#FAFAF8", display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <span style={{ fontSize: 12, color: T.subtle }}>
                {filteredTasks.length} task{filteredTasks.length !== 1 ? "s" : ""}
              </span>
              <div style={{ display: "flex", gap: 8 }}>
                {["To Do", "In Progress", "Done"].map(s => {
                  const count = filteredTasks.filter(t => t.status === s).length;
                  const sc = STATUS[s];
                  return (
                    <span key={s} style={{
                      fontSize: 11, fontWeight: 600,
                      color: sc.color, background: sc.bg,
                      border: `1px solid ${sc.border}`,
                      padding: "2px 8px", borderRadius: 999,
                    }}>
                      {count} {s}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

const labelSt = {
  display: "block", fontSize: 11, fontWeight: 700,
  color: "#9E958C", letterSpacing: "0.06em",
  textTransform: "uppercase", marginBottom: 6,
};

export default EmployeeTaskViewer;