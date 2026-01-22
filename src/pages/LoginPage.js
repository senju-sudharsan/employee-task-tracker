import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";

function LoginPage({ onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      setError("Email and password are required");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      onLoginSuccess(userCredential.user.uid);
    } catch (err) {
      let message = "Login failed. Please try again.";

      if (err.code === "auth/user-not-found") {
        message = "No account found with this email.";
      }

      if (err.code === "auth/wrong-password") {
        message = "Incorrect password.";
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f8fafc"
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          backgroundColor: "white",
          padding: "32px",
          borderRadius: "12px",
          width: "360px",
          boxShadow: "0 10px 20px rgba(0,0,0,0.08)"
        }}
      >
        <h2 style={{ marginBottom: "20px", textAlign: "center" }}>
          Login
        </h2>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: "100%", padding: "10px", marginBottom: "12px" }}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: "100%", padding: "10px", marginBottom: "12px" }}
        />

        <button
          type="submit"
          disabled={loading}
          style={{ width: "100%", padding: "10px" }}
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        {error && (
          <p style={{ marginTop: "12px", color: "#dc2626", fontSize: "14px" }}>
            {error}
          </p>
        )}
      </form>
    </div>
  );
}

export default LoginPage;
