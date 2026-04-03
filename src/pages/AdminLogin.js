import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AdminLogin() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/auth/admin/login", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.message);
    login(data.user);
    navigate("/admin/dashboard");
  };

  return (
    <div style={styles.container}>
      <div style={styles.box}>
        <h2 style={styles.title}>🔐 Admin Login</h2>
        {error && <p style={styles.error}>{error}</p>}
        <form onSubmit={handleSubmit}>
          <input style={styles.input} placeholder="Admin Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <input style={styles.input} placeholder="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          <button style={styles.btn} type="submit">Login as Admin</button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f3f3f3" },
  box: { background: "#fff", padding: "40px", borderRadius: "8px", boxShadow: "0 2px 12px rgba(0,0,0,0.1)", width: "360px" },
  title: { textAlign: "center", marginBottom: "24px", color: "#232f3e" },
  input: { width: "100%", padding: "10px", marginBottom: "14px", border: "1px solid #ddd", borderRadius: "4px", fontSize: "14px", boxSizing: "border-box" },
  btn: { width: "100%", padding: "12px", background: "#232f3e", border: "none", borderRadius: "4px", fontWeight: "bold", fontSize: "15px", cursor: "pointer", color: "#ff9900" },
  error: { color: "red", marginBottom: "12px", textAlign: "center" },
};
