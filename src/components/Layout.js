import { NavLink } from "react-router-dom";

function Layout({ children, role, onLogout }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <aside style={{ width: 260, padding: 20 }}>
        <h2>Workflow Hub</h2>

        <NavLink to="/dashboard">Dashboard</NavLink><br />
        <NavLink to="/tasks">Tasks</NavLink><br />
        <NavLink to="/analytics">Analytics</NavLink><br />
        <NavLink to="/settings">Settings</NavLink><br />

        <p style={{ color: "red", cursor: "pointer" }} onClick={onLogout}>
          Logout
        </p>
      </aside>

      <main style={{ flex: 1, padding: 40, background: "#f8fafc" }}>
        {children}
      </main>
    </div>
  );
}

export default Layout;
