import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { validateEmail, validatePassword, validatePhone, validateName, validateRequired } from "../utils/validation";

export default function DeliveryRegister() {
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", location: "" });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const validate = () => {
    const e = {};
    const nameErr = validateName(form.name);
    const emailErr = validateEmail(form.email);
    const passErr = validatePassword(form.password);
    const phoneErr = validatePhone(form.phone);
    const locationErr = validateRequired(form.location, "City");
    if (nameErr) e.name = nameErr;
    if (emailErr) e.email = emailErr;
    if (passErr) e.password = passErr;
    if (phoneErr) e.phone = phoneErr;
    if (locationErr) e.location = locationErr;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!validate()) return;
    const res = await fetch("/api/auth/register", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, role: "deliveryBoy" }),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.message);
    setSuccess("✅ Registered successfully! Redirecting to login...");
    setTimeout(() => navigate("/delivery/login"), 1500);
  };

  const Field = ({ field, label, type = "text", placeholder, maxLength }) => (
    <div style={styles.fieldWrap}>
      <input
        style={{ ...styles.input, borderColor: errors[field] ? "#e74c3c" : "#ddd" }}
        placeholder={placeholder}
        type={field === "password" ? (showPassword ? "text" : "password") : type}
        value={form[field]}
        maxLength={maxLength}
        onChange={(e) => { setForm({ ...form, [field]: e.target.value }); if (errors[field]) setErrors({ ...errors, [field]: "" }); }}
      />
      {field === "password" && (
        <button type="button" style={styles.eyeBtn} onClick={() => setShowPassword(!showPassword)}>
          {showPassword ? "🙈" : "👁️"}
        </button>
      )}
      {errors[field] && <p style={styles.fieldError}>⚠️ {errors[field]}</p>}
    </div>
  );

  return (
    <div style={styles.container}>
      <div style={styles.box}>
        <div style={styles.icon}>🛵</div>
        <h2 style={styles.title}>Delivery Boy Registration</h2>
        <p style={styles.sub}>Join our delivery team today</p>
        {error && <p style={styles.error}>⚠️ {error}</p>}
        {success && <p style={styles.success}>{success}</p>}
        <form onSubmit={handleSubmit} noValidate>
          <Field field="name" placeholder="👤 Full Name" />
          <Field field="email" type="email" placeholder="📧 Email Address" />
          <Field field="password" type="password" placeholder="🔒 Password (min 8 chars)" />
          {form.password && (
            <div style={styles.strengthBar}>
              {[form.password.length >= 8, /[A-Z]/.test(form.password), /[0-9]/.test(form.password)].map((pass, i) => (
                <div key={i} style={{ ...styles.strengthSegment, background: pass ? "#27ae60" : "#ddd" }} />
              ))}
              <span style={styles.strengthText}>
                {!form.password.length >= 8 ? "Too short" : !/[A-Z]/.test(form.password) ? "Add uppercase" : !/[0-9]/.test(form.password) ? "Add number" : "✅ Strong"}
              </span>
            </div>
          )}
          <Field field="phone" type="tel" placeholder="📱 10-digit Mobile Number" maxLength={10} />
          <Field field="location" placeholder="📍 Your City (e.g. Pune, Mumbai)" />
          <button style={styles.btn} type="submit">Register as Delivery Boy</button>
        </form>
        <p style={styles.link}>
          Already registered? <Link to="/delivery/login" style={{ color: "#ff9900", fontWeight: "bold" }}>Login here</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f3f3f3" },
  box: { background: "#fff", padding: "40px", borderRadius: "12px", boxShadow: "0 2px 12px rgba(0,0,0,0.1)", width: "400px", textAlign: "center" },
  icon: { fontSize: "52px", marginBottom: "8px" },
  title: { marginBottom: "4px", color: "#232f3e", fontSize: "20px" },
  sub: { color: "#888", fontSize: "13px", marginBottom: "20px" },
  fieldWrap: { position: "relative", marginBottom: "4px", textAlign: "left" },
  input: { width: "100%", padding: "11px 14px", marginBottom: "4px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box", outline: "none" },
  eyeBtn: { position: "absolute", right: "12px", top: "11px", background: "none", border: "none", cursor: "pointer", fontSize: "16px" },
  fieldError: { color: "#e74c3c", fontSize: "12px", margin: "0 0 8px", paddingLeft: "2px" },
  strengthBar: { display: "flex", alignItems: "center", gap: "4px", marginBottom: "10px" },
  strengthSegment: { flex: 1, height: "4px", borderRadius: "2px" },
  strengthText: { fontSize: "11px", color: "#888", whiteSpace: "nowrap" },
  btn: { width: "100%", padding: "12px", background: "#ff9900", border: "none", borderRadius: "6px", fontWeight: "bold", fontSize: "15px", cursor: "pointer", marginTop: "8px" },
  error: { color: "#e74c3c", marginBottom: "12px", fontSize: "13px", background: "#fff5f5", padding: "8px", borderRadius: "6px" },
  success: { color: "#27ae60", marginBottom: "12px", fontSize: "13px", background: "#f0fff4", padding: "8px", borderRadius: "6px" },
  link: { marginTop: "16px", fontSize: "13px", color: "#555" },
};
