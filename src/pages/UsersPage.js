import { useEffect, useState } from "react";
import { auth } from "../firebase";
import { getAllUsers, createEmployee } from "../services/userService";
import { getUserProfile } from "../services/authService";

function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [creating, setCreating] = useState(false);

  const [adminOrgId, setAdminOrgId] = useState(null);

  /* ===========================
     LOAD USERS + ADMIN ORG
  =========================== */
  useEffect(() => {
    const bootstrap = async () => {
      if (!auth.currentUser) return;

      const profile = await getUserProfile(auth.currentUser.uid);

      if (profile.role !== "admin") {
        alert("Only admins can access this page");
        return;
      }

      if (!profile.organizationId) {
        alert("Admin has no organization assigned");
        return;
      }

      setAdminOrgId(profile.organizationId);

      const data = await getAllUsers();
      setUsers(data || []);
      setLoading(false);
    };

    bootstrap();
  }, []);

  /* ===========================
     CREATE EMPLOYEE
  =========================== */
  const handleCreate = async () => {
    if (!name || !email || !password) {
      alert("All fields are required");
      return;
    }

    setCreating(true);

    try {
      await createEmployee({
        name,
        email,
        password,
        organizationId: adminOrgId, // 🔒 AUTO ASSIGNED
        createdBy: auth.currentUser.uid
      });

      setName("");
      setEmail("");
      setPassword("");

      const data = await getAllUsers();
      setUsers(data || []);
    } catch (err) {
      console.error(err);
      alert(err.message);
    }

    setCreating(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
      <h1>Employees</h1>

      {/* USERS LIST */}
      <div>
        {loading && <p>Loading...</p>}

        {!loading &&
          users
            .filter(u => u.organizationId === adminOrgId)
            .map(u => (
              <div key={u.id} style={{ padding: "8px 0" }}>
                <strong>{u.name}</strong> — {u.email}
              </div>
            ))}
      </div>

      {/* CREATE EMPLOYEE */}
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
    </div>
  );
}

export default UsersPage;
