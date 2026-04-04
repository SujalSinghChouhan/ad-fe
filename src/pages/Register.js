import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { validateEmail, validatePassword, validatePhone, validateName } from "../utils/validation";
import { safeFetch } from "../utils/safeFetch";

export default function Register() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "customer", phone: "" });
  const [errors, setErrors] = useState({});
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
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
    setLoading(true);
    try {
      const res = await safeFetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: form.phone, purpose: "registration" }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.message || "Failed to send OTP");
      setSuccess(data.devOtp ? `Dev OTP: ${data.devOtp}` : "OTP sent to your phone!");
      setStep(2);
    } catch {
      setError("Cannot connect to server. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndRegister = async (e) => {
    e.preventDefault();
    setError("");
    if (!otp || otp.length !== 6) return setError("Enter a valid 6-digit OTP");
    setLoading(true);
    try {
      // Verify OTP first
      const otpRes = await safeFetch("/api/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: form.phone, otp }),
      });
      const otpData = await otpRes.json();
      if (!otpRes.ok) return setError(otpData.message || "Invalid OTP");

      // Then register
      const res = await safeFetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.message || "Registration failed");

      setSuccess("✅ Registered successfully! Redirecting to login...");
      setTimeout(() => {
        if (form.role === "deliveryBoy") navigate("/delivery/login");
        else navigate("/login");
      }, 1500);
    } catch {
      setError("Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const Field = ({ field, label, type = "text", placeholder }) => (
    <div style={{ position: "relative", marginBottom: "4px" }}>
      <label style={s.label}>{label}</label>
      <input
        style={{ ...s.input, borderColor: errors[field] ? "#e74c3c" : "#e5e5e5" }}
        placeholder={placeholder}
        type={field === "password" ? (showPassword ? "text" : "password") : type}
        value={form[field]}
        maxLength={field === "phone" ? 10 : undefined}
        inputMode={field === "phone" ? "numeric" : undefined}
        onChange={(e) => {
          setForm({ ...form, [field]: e.target.value });
          if (errors[field]) setErrors({ ...errors, [field]: "" });
        }}
      />
      {field === "password" && (
        <button type="button" style={s.eyeBtn} onClick={() => setShowPassword(!showPassword)}>
          {showPassword ? "🙈" : "👁️"}
        </button>
      )}
      {errors[field] && <p style={s.fieldError}>⚠️ {errors[field]}</p>}
    </div>
  );

  const passwordStrength = () => {
    const p = form.password;
    const checks = [p.length >= 8, /[A-Z]/.test(p), /[0-9]/.test(p)];
    const passed = checks.filter(Boolean).length;
    return { passed, label: passed === 0 ? "" : passed === 1 ? "Weak" : passed === 2 ? "Medium" : "Strong", color: ["", "#e74c3c", "#ff9900", "#27ae60"][passed] };
  };
  const strength = passwordStrength();

  return (
    <div style={s.container}>
      <div style={s.box}>
        <div style={s.logoWrap}>
          <span style={s.logo}>📝</span>
          <h2 style={s.title}>Create Account</h2>
          <p style={s.subtitle}>Join Apni Dukann today</p>
        </div>

        {/* Step indicator */}
        <div style={s.steps}>
          {["Details", "Verify OTP"].map((label, i) => (
            <div key={i} style={s.stepItem}>
              <div style={{ ...s.stepDot, background: step > i + 1 ? "#27ae60" : step === i + 1 ? "#ff9900" : "#ddd" }}>
                {step > i + 1 ? "✓" : i + 1}
              </div>
              <span style={{ fontSize: "11px", fontWeight: "700", color: step === i + 1 ? "#ff9900" : "#aaa" }}>{label}</span>
            </div>
          ))}
        </div>

        {error && <div style={s.errorBox}>⚠️ {error}</div>}
        {success && <div style={s.successBox}>{success}</div>}

        {step === 1 && (
          <form onSubmit={handleSendOTP} noValidate>
            <Field field="name" label="Full Name" placeholder="Your full name" />
            <Field field="email" label="Email Address" type="email" placeholder="you@example.com" />
            <Field field="password" label="Password" type="password" placeholder="Min 8 chars, 1 uppercase, 1 number" />

            {/* Password strength */}
            {form.password && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px", marginTop: "-2px" }}>
                {[1, 2, 3].map((i) => (
                  <div key={i} style={{ flex: 1, height: "4px", borderRadius: "2px", background: i <= strength.passed ? strength.color : "#e5e5e5", transition: "background 0.3s" }} />
                ))}
                <span style={{ fontSize: "12px", color: strength.color, fontWeight: "700", whiteSpace: "nowrap" }}>{strength.label}</span>
              </div>
            )}

            <Field field="phone" label="Mobile Number" type="tel" placeholder="10-digit Indian number" />
            <p style={{ color: "#aaa", fontSize: "12px", margin: "-8px 0 16px" }}>📱 OTP will be sent to this number</p>

            <label style={s.label}>Register As</label>
            <select style={{ ...s.input, cursor: "pointer" }} value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="customer">🛍️ Customer</option>
              <option value="shopkeeper">🏪 Shopkeeper</option>
              <option value="deliveryBoy">🛵 Delivery Boy</option>
            </select>

            <button style={{ ...s.btn, opacity: loading ? 0.7 : 1 }} type="submit" disabled={loading}>
              {loading ? "Sending OTP..." : "Send OTP →"}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyAndRegister}>
            <p style={s.otpInfo}>
              📱 Enter the 6-digit OTP sent to <strong>{form.phone}</strong>
            </p>
            <input
              style={s.otpInput}
              placeholder="------"
              value={otp}
              onChange={(e) => { setOtp(e.target.value.replace(/\D/g, "")); setError(""); }}
              maxLength={6}
              inputMode="numeric"
            />
            <button style={{ ...s.btn, opacity: loading ? 0.7 : 1 }} type="submit" disabled={loading}>
              {loading ? "Registering..." : "Verify & Register ✓"}
            </button>
            <button type="button" style={s.backBtn}
              onClick={() => { setStep(1); setError(""); setSuccess(""); setOtp(""); }}>
              ← Change Details
            </button>
          </form>
        )}

        <p style={s.loginLink}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: "#ff9900", fontWeight: "bold" }}>Login</Link>
        </p>
      </div>
    </div>
  );
}

const s = {
  container: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f5f5", padding: "24px" },
  box: { background: "#fff", padding: "40px 36px", borderRadius: "20px", boxShadow: "0 4px 24px rgba(0,0,0,0.10)", width: "100%", maxWidth: "440px" },
  logoWrap: { textAlign: "center", marginBottom: "24px" },
  logo: { fontSize: "40px" },
  title: { margin: "8px 0 4px", fontSize: "26px", fontWeight: "900", color: "#1a1a1a" },
  subtitle: { margin: 0, fontSize: "14px", color: "#888" },
  steps: { display: "flex", justifyContent: "center", gap: "40px", marginBottom: "24px" },
  stepItem: { display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" },
  stepDot: { width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "14px", color: "#fff" },
  label: { display: "block", fontSize: "13px", fontWeight: "700", color: "#444", marginBottom: "6px" },
  input: { width: "100%", padding: "13px 16px", marginBottom: "16px", border: "1.5px solid #e5e5e5", borderRadius: "10px", fontSize: "15px", boxSizing: "border-box", outline: "none", background: "#fafafa", color: "#1a1a1a" },
  eyeBtn: { position: "absolute", right: "14px", top: "34px", background: "none", border: "none", cursor: "pointer", fontSize: "18px" },
  fieldError: { color: "#e74c3c", fontSize: "12px", margin: "-10px 0 12px", paddingLeft: "4px" },
  btn: { width: "100%", padding: "15px", background: "#ff9900", border: "none", borderRadius: "12px", fontWeight: "900", fontSize: "16px", cursor: "pointer", marginBottom: "12px", color: "#fff", boxShadow: "0 4px 14px rgba(255,153,0,0.3)", transition: "all 0.2s" },
  backBtn: { width: "100%", padding: "13px", background: "#f5f5f5", border: "none", borderRadius: "12px", fontWeight: "700", fontSize: "14px", cursor: "pointer", color: "#555" },
  otpInput: { width: "100%", padding: "16px", marginBottom: "16px", border: "1.5px solid #ff9900", borderRadius: "12px", fontSize: "28px", textAlign: "center", letterSpacing: "12px", fontWeight: "900", boxSizing: "border-box", outline: "none", color: "#ff9900", background: "#fff8f0" },
  otpInfo: { textAlign: "center", color: "#555", fontSize: "14px", marginBottom: "20px" },
  errorBox: { background: "#fff0ed", color: "#c0392b", padding: "12px 16px", borderRadius: "10px", marginBottom: "16px", fontSize: "14px", fontWeight: "600" },
  successBox: { background: "#e8f5e9", color: "#27ae60", padding: "12px 16px", borderRadius: "10px", marginBottom: "16px", fontSize: "14px", fontWeight: "600" },
  loginLink: { textAlign: "center", marginTop: "20px", fontSize: "14px", color: "#888" },
};
