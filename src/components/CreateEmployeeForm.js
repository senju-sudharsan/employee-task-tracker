import { useState } from "react";
import { createEmployeeUser } from "../services/userService";

function CreateEmployeeForm({ organizationId, createdBy }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

   if (!name || !email || !password || !confirmPassword) {
  setMessage("All fields are required");
  return;
}

if (password !== confirmPassword) {
  setMessage("Passwords do not match");
  return;
}

    try {
      setLoading(true);
      setMessage("");

      await createEmployeeUser({
        name,
        email,
        password,
        organizationId,
        createdBy
      });

      setMessage("Employee created successfully");
      setName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");

    } catch (error) {
      console.error(error);
      let friendlyMessage = "Something went wrong. Please try again.";

if (error.code === "auth/weak-password") {
  friendlyMessage = "Password must be at least 6 characters long.";
}

if (error.code === "auth/email-already-in-use") {
  friendlyMessage = "This email is already registered.";
}

if (error.code === "auth/invalid-email") {
  friendlyMessage = "Please enter a valid email address.";
}

setMessage(friendlyMessage);

    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: "10px",
        padding: "16px",
        marginBottom: "24px"
      }}
    >
      <h3 style={{ marginBottom: "12px" }}>Create Employee</h3>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "10px" }}>
          <input
            type="text"
            placeholder="Employee Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ width: "100%", padding: "8px" }}
          />
        </div>

        <div style={{ marginBottom: "10px" }}>
          <input
            type="email"
            placeholder="Employee Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: "100%", padding: "8px" }}
          />
        </div>

        <div style={{ marginBottom: "10px" }}>
          <input
            type="password"
            placeholder="Temporary Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: "100%", padding: "8px" }}
          />
        </div>

        <div style={{ marginBottom: "10px" }}>
  <input
    type="password"
    placeholder="Confirm Password"
    value={confirmPassword}
    onChange={(e) => setConfirmPassword(e.target.value)}
    style={{ width: "100%", padding: "8px" }}
  />
</div>


        <button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create Employee"}
        </button>

        {message && (
          <p style={{ marginTop: "10px", fontSize: "14px" }}>
            {message}
          </p>
        )}
      </form>
    </div>
  );
}

export default CreateEmployeeForm;
