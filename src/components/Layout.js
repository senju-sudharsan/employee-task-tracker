import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  Users,
  Settings,
  LogOut
} from "lucide-react";

function Layout({ children, role, onLogout }) {
  const location = useLocation();

  const navByRole = {
    super_admin: [
      { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
      { name: "Organizations", path: "/organizations", icon: Building2 },
      { name: "Users", path: "/users", icon: Users },
      { name: "Settings", path: "/settings", icon: Settings }
    ],
    admin: [
      { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
      { name: "Tasks", path: "/tasks", icon: Users },
      { name: "Settings", path: "/settings", icon: Settings }
    ],
    employee: [
      { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
      { name: "Settings", path: "/settings", icon: Settings }
    ]
  };

  const navItems = navByRole[role] || [];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#FEFCF9" }}>
      {/* SIDEBAR */}
      <aside
        style={{
          width: 260,
          backgroundColor: "#FFFFFF",
          borderRight: "1px solid #E2E8F0",
          display: "flex",
          flexDirection: "column"
        }}
      >
        {/* BRAND */}
        <div style={{ padding: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "10px",
                backgroundColor: "#E2E8F0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                color: "#475569"
              }}
            >
              LOGO
            </div>
            <span style={{ fontSize: "20px", fontWeight: 700 }}>
              WorkflowHub
            </span>
          </div>
        </div>

        {/* NAV */}
        <nav
          style={{
            flex: 1,
            padding: "8px 12px",
            display: "flex",
            flexDirection: "column",
            gap: "6px"
          }}
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "12px 16px",
                  borderRadius: "12px",
                  textDecoration: "none",
                  fontSize: "15px",
                  fontWeight: 500,
                  color: isActive ? "#FFFFFF" : "#475569",
                  background: isActive
                    ? "linear-gradient(135deg, #16A6B0, #0891B2)"
                    : "transparent"
                }}
              >
                <Icon size={18} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* LOGOUT */}
        <div style={{ padding: "16px" }}>
          <button
            onClick={onLogout}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "12px 16px",
              borderRadius: "12px",
              border: "none",
              backgroundColor: "#FEE2E2",
              color: "#B91C1C",
              fontWeight: 500,
              cursor: "pointer"
            }}
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main style={{ flex: 1, padding: "40px" }}>
        {children}
      </main>
    </div>
  );
}

export default Layout;
