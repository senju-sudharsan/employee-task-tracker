import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  Users,
  BarChart3,
  ClipboardList,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShieldAlert
} from "lucide-react";

function Layout({ children, role, onLogout }) {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navByRole = {
  super_admin: [
    { name: "Dashboard",      path: "/dashboard",     icon: LayoutDashboard },
    { name: "Organizations",  path: "/organizations", icon: Building2 },
    { name: "Users",          path: "/users",         icon: Users },
    
  ],

  admin: [
    { name: "Dashboard",   path: "/dashboard", icon: LayoutDashboard },
    { name: "Tasks",       path: "/tasks",     icon: ClipboardList },
    { name: "Employees",   path: "/employees", icon: Users },
    { name: "Task Monitor", path: "/employee-task-viewer", icon: ClipboardList }
  
  ],

  employee: [
    { name: "Tasks",    path: "/tasks",    icon: ClipboardList },
    { name: "Insights", path: "/insights", icon: BarChart3 }
  ]
};

  const navItems = navByRole[role] || [];
  const showDangerZone = role === "super_admin" || role === "admin";
  const isDangerActive = location.pathname === "/danger";

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#FAF6EE", fontFamily: "'Poppins', sans-serif" }}>
      <aside
        style={{
          width: isCollapsed ? 80 : 260,
          backgroundColor: "#FFFFFF",
          borderRight: "1px solid #E8E4DD",
          display: "flex",
          flexDirection: "column",
          transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          position: "relative",
          flexShrink: 0,
        }}
      >
        {/* ── Logo ── */}
        <div style={{ padding: isCollapsed ? "24px 16px" : "24px", transition: "padding 0.3s ease" }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            justifyContent: isCollapsed ? "center" : "flex-start",
            overflow: "hidden"
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: "10px",
              background: "linear-gradient(135deg, #F5E6D3 0%, #E8D4B8 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 700, fontSize: 14, color: "#8B6F47",
              flexShrink: 0, boxShadow: "0 2px 8px rgba(139, 111, 71, 0.15)"
            }}>
              WH
            </div>
            {!isCollapsed && (
              <span style={{
                fontSize: "18px", fontWeight: 700,
                color: "#1F1F1F", letterSpacing: "-0.3px", whiteSpace: "nowrap"
              }}>
                WorkflowHub
              </span>
            )}
          </div>
        </div>

        {/* ── Main nav ── */}
        <nav style={{
          flex: 1,
          padding: isCollapsed ? "8px 12px" : "8px 16px",
          display: "flex", flexDirection: "column", gap: "4px",
          transition: "padding 0.3s ease"
        }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                title={isCollapsed ? item.name : undefined}
                style={{
                  display: "flex", alignItems: "center", gap: "12px",
                  padding: isCollapsed ? "14px 0" : "12px 14px",
                  borderRadius: "10px", textDecoration: "none",
                  fontSize: "14px", fontWeight: isActive ? 600 : 500,
                  color: isActive ? "#8B6F47" : "#64748B",
                  background: isActive
                    ? "linear-gradient(135deg, #FDF8F0 0%, #F5E6D3 100%)"
                    : "transparent",
                  border: isActive ? "1px solid #E8D4B8" : "1px solid transparent",
                  transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                  justifyContent: isCollapsed ? "center" : "flex-start",
                  position: "relative"
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "#FAF8F4";
                    e.currentTarget.style.color = "#8B6F47";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "#64748B";
                  }
                }}
              >
                <Icon size={19} strokeWidth={isActive ? 2.5 : 2} style={{ flexShrink: 0 }} />
                {!isCollapsed && <span style={{ whiteSpace: "nowrap" }}>{item.name}</span>}
                {isActive && (
                  <div style={{
                    position: "absolute", left: 0, top: "50%",
                    transform: "translateY(-50%)",
                    width: 3, height: "60%",
                    background: "linear-gradient(180deg, #D4AF37 0%, #B8941F 100%)",
                    borderRadius: "0 2px 2px 0"
                  }} />
                )}
              </Link>
            );
          })}

          {/* ── Danger Zone ── */}
          {showDangerZone && (
            <>
              <div style={{
                margin: "10px 0 6px",
                height: 1,
                background: isCollapsed
                  ? "rgba(122,0,25,.12)"
                  : "linear-gradient(90deg, rgba(122,0,25,.15) 0%, rgba(122,0,25,.04) 100%)",
              }} />

              <Link
                to="/danger"
                title={isCollapsed ? "Danger Zone" : undefined}
                style={{
                  display: "flex", alignItems: "center", gap: "12px",
                  padding: isCollapsed ? "14px 0" : "12px 14px",
                  borderRadius: "10px", textDecoration: "none",
                  fontSize: "14px", fontWeight: isDangerActive ? 600 : 500,
                  color: isDangerActive ? "#7A0019" : "#A05060",
                  background: isDangerActive
                    ? "linear-gradient(135deg, rgba(122,0,25,.08) 0%, rgba(122,0,25,.04) 100%)"
                    : "transparent",
                  border: isDangerActive
                    ? "1px solid rgba(122,0,25,.18)"
                    : "1px solid transparent",
                  transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                  justifyContent: isCollapsed ? "center" : "flex-start",
                  position: "relative",
                }}
                onMouseEnter={(e) => {
                  if (!isDangerActive) {
                    e.currentTarget.style.background = "rgba(122,0,25,.05)";
                    e.currentTarget.style.color = "#7A0019";
                    e.currentTarget.style.borderColor = "rgba(122,0,25,.12)";
                    e.currentTarget.style.boxShadow = "0 0 12px rgba(122,0,25,.07)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isDangerActive) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "#A05060";
                    e.currentTarget.style.borderColor = "transparent";
                    e.currentTarget.style.boxShadow = "none";
                  }
                }}
              >
                <ShieldAlert
                  size={19}
                  strokeWidth={isDangerActive ? 2.5 : 2}
                  style={{ flexShrink: 0, color: isDangerActive ? "#7A0019" : "#B06070" }}
                />
                {!isCollapsed && <span style={{ whiteSpace: "nowrap" }}>Danger Zone</span>}
                {isDangerActive && (
                  <div style={{
                    position: "absolute", left: 0, top: "50%",
                    transform: "translateY(-50%)",
                    width: 3, height: "60%",
                    background: "linear-gradient(180deg, #9B0022 0%, #7A0019 100%)",
                    borderRadius: "0 2px 2px 0"
                  }} />
                )}
              </Link>
            </>
          )}
        </nav>

        {/* ── Logout ── */}
        <div style={{ padding: isCollapsed ? "8px 12px 20px" : "8px 16px 20px", transition: "padding 0.3s ease" }}>
          <div style={{ height: 1, background: "#F1EDE8", marginBottom: 10 }} />
          <button
            onClick={onLogout}
            title={isCollapsed ? "Logout" : undefined}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: "10px",
              padding: isCollapsed ? "12px 0" : "11px 14px",
              borderRadius: "10px", border: "1px solid #FFE4E4",
              backgroundColor: "#FFF5F5", color: "#DC2626",
              fontSize: "14px", fontWeight: 500, cursor: "pointer",
              transition: "all 0.2s ease", fontFamily: "'Poppins', sans-serif",
              justifyContent: isCollapsed ? "center" : "flex-start"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#FEE2E2";
              e.currentTarget.style.borderColor = "#FECACA";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#FFF5F5";
              e.currentTarget.style.borderColor = "#FFE4E4";
            }}
          >
            <LogOut size={17} strokeWidth={2} style={{ flexShrink: 0 }} />
            {!isCollapsed && <span style={{ whiteSpace: "nowrap" }}>Logout</span>}
          </button>
        </div>

        {/* ── Collapse toggle ── */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          style={{
            position: "absolute", top: "50%", right: -16,
            transform: "translateY(-50%)",
            width: 32, height: 32, borderRadius: "50%",
            border: "1px solid #E8E4DD", background: "#FFFFFF",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
            transition: "all 0.2s ease", color: "#8B6F47", zIndex: 10,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "linear-gradient(135deg, #FDF8F0 0%, #F5E6D3 100%)";
            e.currentTarget.style.boxShadow = "0 4px 12px rgba(139, 111, 71, 0.2)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#FFFFFF";
            e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.08)";
          }}
        >
          {isCollapsed ? <ChevronRight size={18} strokeWidth={2.5} /> : <ChevronLeft size={18} strokeWidth={2.5} />}
        </button>
      </aside>

      {/* ── Main content ── */}
      <main style={{
        flex: 1,
        padding: "36px 40px",
        minWidth: 0,
        overflow: "auto",
        background: "#FAF6EE",   /* ← matches page warm cream, no white bleed */
      }}>
        {children}
      </main>
    </div>
  );
}

export default Layout;