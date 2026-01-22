import { NavLink } from "react-router-dom";

function Sidebar({ role, onLogout }) {
  return (
    <aside style={{ width: 260, padding: 20 }}>
      <h2>Workflow Hub</h2>

      <NavLink to="/dashboard">Dashboard</NavLink><br />
      <NavLink to="/tasks">Tasks</NavLink><br />
      <NavLink to="/analytics">Analytics</NavLink><br />
      <NavLink to="/settings">Settings</NavLink><br />

      <div
        onClick={onLogout}
        style={{ marginTop: 40, color: "red", cursor: "pointer" }}
      >
        Logout
      </div>
    </aside>
  );
}

export default Sidebar;

