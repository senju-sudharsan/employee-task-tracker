import { useEffect, useState } from "react";
import { auth } from "../firebase";
import { getAllUsers, createEmployee } from "../services/userService";
import { getUserProfile } from "../services/authService";
import { ROLES, roleCapabilities } from "../config/roles";
import { getAllOrganizations } from "../services/organizationService";

function UsersPage() {
  const [users, setUsers] = useState([]);
  const [organizations, setOrganizations] = useState([]);

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  const [selectedOrgId, setSelectedOrgId] = useState(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [creating, setCreating] = useState(false);

  /* ===========================
     BOOTSTRAP
  =========================== */
  useEffect(() => {
    const bootstrap = async () => {
      if (!auth.currentUser) return;

      const userProfile = await getUserProfile(auth.currentUser.uid);
      setProfile(userProfile);

      const role = userProfile.role;

      // 🔐 ACCESS GATE (FINAL, CORRECT)
      if (!roleCapabilities[role]?.canManageUsers) {
        alert("Access denied");
        setLoading(false);
        return;
      }

      // 🟣 SUPER ADMIN → select org
      if (role === ROLES.SUPERADMIN) {
        const orgs = await getAllOrganizations();
        setOrganizations(orgs || []);
      }

      // 🔵 ADMIN → forced org
      if (role === ROLES.ADMIN) {
        if (!userProfile.organizationId) {
          alert("Admin has no organization assigned");
          setLoading(false);
          return;
        }
        setSelectedOrgId(userProfile.organizationId);
      }

      const allUsers = await getAllUsers();
      setUsers(allUsers || []);
      setLoading(false);
    };

    bootstrap();
  }, []);

  /* ===========================
     CREATE EMPLOYEE
  =========================== */
  const handleCreate = async () => {
    if (!name || !email || !password || !selectedOrgId) {
      alert("All fields are required");
      return;
    }

    setCreating(true);

    try {
      await createEmployee({
        name,
        email,
        password,
        organizationId: selectedOrgId,
        createdBy: auth.currentUser.uid
      });

      setName("");
      setEmail("");
      setPassword("");

      const updated = await getAllUsers();
      setUsers(updated || []);
    } catch (err) {
      alert(err.message);
    }

    setCreating(false);
  };

  /* ===========================
     FILTER USERS BY ORG
  =========================== */
  const visibleUsers = selectedOrgId
    ? users.filter(u => u.organizationId === selectedOrgId)
    : [];

  if (loading) return <p>Loading...</p>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <h1>Employees</h1>

      {/* SUPER ADMIN ORG SELECT */}
      {profile?.role === ROLES.SUPERADMIN && (
        <select
          value={selectedOrgId || ""}
          onChange={e => setSelectedOrgId(e.target.value)}
        >
          <option value="">Select Organization</option>
          {organizations.map(org => (
            <option key={org.id} value={org.id}>
              {org.name}
            </option>
          ))}
        </select>
      )}

      {/* SUPER ADMIN EMPTY STATE */}
      {profile?.role === ROLES.SUPERADMIN && !selectedOrgId && (
        <p style={{ color: "#666" }}>
          Select an organization to view and manage employees.
        </p>
      )}

      {/* USERS LIST */}
      <div>
        {visibleUsers.map(u => (
          <div key={u.id} style={{ padding: "6px 0" }}>
            <strong>{u.name}</strong> — {u.email}
          </div>
        ))}
      </div>

      {/* CREATE EMPLOYEE */}
      {selectedOrgId && (
        <div style={{ borderTop: "1px solid #eee", paddingTop: "24px" }}>
          <h3>Create Employee</h3>

          <input
            placeholder="Name"
            value={name}
            onChange={e => setName(e.target.value)}
          />
          <br />

          <input
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <br />

          <input
            type="password"
            placeholder="Temporary Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <br />

          <button onClick={handleCreate} disabled={creating}>
            {creating ? "Creating..." : "Create Employee"}
          </button>
        </div>
      )}
    </div>
  );
}

export default UsersPage;
