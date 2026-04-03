import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { validateEmail, validatePassword, validatePhone, validateName } from "../utils/validation";

export default function Register() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "customer", phone: "" });
  const [errors, setErrors] = useState({});
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [sending, setSending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const validate = () => {
    const e = {};
    const nameErr = validateName(form.name);
    const emailErr = validateEmail(form.email);
    const passErr = validatePassword(form.password);
    const phoneErr = validatePhone(form.phone);
    if (nameErr) e.name = nameErr;
    if (emailErr) e.email = emailErr;
    if (passErr) e.password = passErr;
    if (phoneErr) e.phone = phoneErr;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError("");
    if (!validate()) return;
    setSending(true);
    const res = await fetch("/api/otp/send", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: form.phone, purpose: "registration" }),
    });
    const data = await res.json();
    setSending(false);
    if (!res.ok) return setError(data.message);
    if (data.devOtp) setSuccess(`Dev OTP: ${data.devOtp}`);
    else setSuccess("OTP sent to your phone!");
    setStep(2);
  };

  const handleVerifyAndRegister = async (e) => {
    e.preventDefault();
    setError("");
    if (!otp || otp.length !== 6) return setError("Enter a valid 6-digit OTP");
    const otpRes = await fetch("/api/otp/verify", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: form.phone, otp }),
    });
    const otpData = await otpRes.json();
    if (!otpRes.ok) return setError(otpData.message);
    const res = await fetch("/api/auth/register", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.message);
    setSuccess("✅ Registered successfully! Redirecting...");
    setTimeout(() => {
      if (form.role === "deliveryBoy") navigate("/delivery/login");
      else navigate("/login");
    }, 1500);
  };

  const Field = ({ field, label, type = "text", placeholder }) => (
    <div style={styles.fieldWrap}>
      <input
        style={{ ...styles.input, borderColor: errors[field] ? "#e74c3c" : "#ddd" }}
        placeholder={placeholder || label}
        type={field === "password" ? (showPassword ? "text" : "password") : type}
        value={form[field]}
        maxLength={field === "phone" ? 10 : undefined}
        onChange={(e) => {
          setForm({ ...form, [field]: e.target.value });
          if (errors[field]) setErrors({ ...errors, [field]: "" });
        }}
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
        <h2 style={styles.title}>📝 Create Account</h2>

        <div style={styles.steps}>
          <div style={{ ...styles.stepDot, background: step >= 1 ? "#ff9900" : "#ddd" }}>1</div>
          <div style={styles.stepLine} />
          <div style={{ ...styles.stepDot, background: step >= 2 ? "#ff9900" : "#ddd" }}>2</div>
        </div>
        <div style={styles.stepLabels}>
          <span style={{ color: step === 1 ? "#ff9900" : "#888" }}>Details</span>
          <span style={{ color: step === 2 ? "#ff9900" : "#888" }}>Verify OTP</span>
        </div>

        {error && <p style={styles.error}>⚠️ {error}</p>}
        {success && <p style={styles.success}>{success}</p>}

        {step === 1 && (
          <form onSubmit={handleSendOTP} noValidate>
            <Field field="name" label="Full Name" placeholder="👤 Full Name" />
            <Field field="email" label="Email" type="email" placeholder="📧 Email Address" />
            <Field field="password" label="Password" type="password" placeholder="🔒 Password (min 8 chars)" />

            {/* Password strength indicator */}
            {form.password && (
              <div style={styles.strengthBar}>
                {["length", "upper", "number"].map((check, i) => {
                  const pass = check === "length" ? form.password.length >= 8 : check === "upper" ? /[A-Z]/.test(form.password) : /[0-9]/.test(form.password);
                  return <div key={i} style={{ ...styles.strengthSegment, background: pass ? "#27ae60" : "#ddd" }} />;
                })}
                <span style={styles.strengthText}>
                  {form.password.length < 8 ? "Too short" : !/[A-Z]/.test(form.password) ? "Add uppercase" : !/[0-9]/.test(form.password) ? "Add number" : "✅ Strong"}
                </span>
              </div>
            )}

            <Field field="phone" label="Phone" type="tel" placeholder="📱 10-digit Mobile Number" />
            <p style={styles.hint}>📱 OTP will be sent to this number</p>

            <select style={styles.input} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="customer">🛍️ Customer</option>
              <option value="shopkeeper">🏪 Shopkeeper</option>
              <option value="deliveryBoy">🛵 Delivery Boy</option>
            </select>

            <button style={styles.btn} type="submit" disabled={sending}>
              {sending ? "Sending OTP..." : "Send OTP →"}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyAndRegister}>
            <p style={styles.otpInfo}>📱 Enter the 6-digit OTP sent to <strong>{form.phone}</strong></p>
            <input
              style={{ ...styles.input, textAlign: "center", fontSize: "24px", letterSpacing: "8px", fontWeight: "bold", borderColor: error ? "#e74c3c" : "#ff9900" }}
              placeholder="------" value={otp}
              onChange={(e) => { setOtp(e.target.value.replace(/\D/g, "")); setError(""); }}
              maxLength={6} inputMode="numeric"
            />
            <button style={styles.btn} type="submit">Verify & Register ✓</button>
            <button type="button" style={styles.resendBtn} onClick={() => { setStep(1); setError(""); setSuccess(""); }}>
              ← Change Details
            </button>
          </form>
        )}

        <p style={styles.link}>Already have an account? <Link to="/login">Login</Link></p>
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--surface)", padding: "24px" },
  box: { background: "var(--surface-lowest)", padding: "48px 40px", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-hover)", width: "100%", maxWidth: "440px" },
  title: { textAlign: "center", marginBottom: "28px", color: "var(--on-surface)", fontFamily: "var(--font-display)", fontSize: "28px", fontWeight: "800", letterSpacing: "-0.02em" },
  steps: { display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "8px" },
  stepDot: { width: "32px", height: "32px", borderRadius: "50%", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "14px" },
  stepLine: { width: "64px", height: "3px", background: "var(--surface-low)", margin: "0 10px", borderRadius: "2px" },
  stepLabels: { display: "flex", justifyContent: "space-around", marginBottom: "24px", fontSize: "13px", fontWeight: "700", fontFamily: "var(--font-body)" },
  fieldWrap: { position: "relative", marginBottom: "4px" },
  input: { width: "100%", padding: "14px 18px", marginBottom: "4px", border: "none", borderRadius: "var(--radius-sm)", fontSize: "15px", boxSizing: "border-box", outline: "none", background: "var(--surface-low)", fontFamily: "var(--font-body)", color: "var(--on-surface)" },
  eyeBtn: { position: "absolute", right: "14px", top: "14px", background: "none", border: "none", cursor: "pointer", fontSize: "18px" },
  fieldError: { color: "#b02500", fontSize: "12px", margin: "0 0 12px", paddingLeft: "4px", fontFamily: "var(--font-body)" },
  strengthBar: { display: "flex", alignItems: "center", gap: "6px", marginBottom: "14px" },
  strengthSegment: { flex: 1, height: "4px", borderRadius: "2px" },
  strengthText: { fontSize: "12px", color: "#747776", whiteSpace: "nowrap", fontFamily: "var(--font-body)" },
  hint: { color: "#747776", fontSize: "13px", margin: "-2px 0 14px", fontFamily: "var(--font-body)" },
  btn: { width: "100%", padding: "16px", background: "var(--primary)", border: "none", borderRadius: "var(--radius-full)", fontWeight: "bold", fontSize: "16px", cursor: "pointer", marginBottom: "12px", marginTop: "8px", color: "var(--on-primary)", fontFamily: "var(--font-display)", boxShadow: "0 8px 20px rgba(0, 106, 40, 0.2)", transition: "all 0.2s" },
  resendBtn: { width: "100%", padding: "14px", background: "var(--surface-low)", border: "none", borderRadius: "var(--radius-full)", fontWeight: "bold", fontSize: "14px", cursor: "pointer", color: "var(--on-surface)", fontFamily: "var(--font-body)" },
  otpInfo: { textAlign: "center", color: "#595c5b", fontSize: "14px", marginBottom: "20px", fontFamily: "var(--font-body)" },
  error: { color: "#b02500", marginBottom: "16px", textAlign: "center", fontSize: "14px", background: "#fff0ed", padding: "10px", borderRadius: "var(--radius-sm)", fontFamily: "var(--font-body)" },
  success: { color: "var(--primary)", marginBottom: "16px", textAlign: "center", fontSize: "14px", background: "#e8f5e9", padding: "10px", borderRadius: "var(--radius-sm)", fontFamily: "var(--font-body)" },
  link: { textAlign: "center", marginTop: "20px", fontSize: "14px", color: "#595c5b", fontFamily: "var(--font-body)" },
};
