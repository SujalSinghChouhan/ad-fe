import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function DeliveryLogin() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.message);
    if (data.user.role !== "deliveryBoy") return setError("❌ Not a delivery boy account. Please use the correct login page.");
    login(data.user);
    navigate("/delivery/dashboard");
  };

  return (
    <div style={styles.container}>
      <div style={styles.box}>
        <div style={styles.icon}>🛵</div>
        <h2 style={styles.title}>Delivery Boy Login</h2>
        <p style={styles.sub}>Login to manage your deliveries</p>
        {error && <p style={styles.error}>{error}</p>}
        <form onSubmit={handleSubmit}>
          <input style={styles.input} placeholder="📧 Email" type="email" value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <input style={styles.input} placeholder="🔒 Password" type="password" value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          <button style={styles.btn} type="submit">Login 🛵</button>
        </form>
        <p style={styles.link}>
          New delivery boy? <Link to="/delivery/register" style={{ color: "#ff9900", fontWeight: "bold" }}>Register here</Link>
        </p>
        <p style={styles.link}>
          Forgot password? <Link to="/login" style={{ color: "#888" }}>Reset here</Link>
        </p>
        <p style={styles.link}>
          Not a delivery boy? <Link to="/login" style={{ color: "#888" }}>Customer Login</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f3f3f3" },
  box: { background: "#fff", padding: "40px", borderRadius: "12px", boxShadow: "0 2px 12px rgba(0,0,0,0.1)", width: "360px", textAlign: "center" },
  icon: { fontSize: "52px", marginBottom: "8px" },
  title: { marginBottom: "4px", color: "#232f3e", fontSize: "22px" },
  sub: { color: "#888", fontSize: "13px", marginBottom: "20px" },
  input: { width: "100%", padding: "10px", marginBottom: "14px", border: "1px solid #ddd", borderRadius: "4px", fontSize: "14px", boxSizing: "border-box", textAlign: "left" },
  btn: { width: "100%", padding: "12px", background: "#ff9900", border: "none", borderRadius: "4px", fontWeight: "bold", fontSize: "15px", cursor: "pointer" },
  error: { color: "red", marginBottom: "12px", fontSize: "13px" },
  link: { marginTop: "12px", fontSize: "13px", color: "#555" },
};
