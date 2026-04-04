import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { validateRequired, validateEmail } from "../utils/validation";
import { safeFetch } from "../utils/safeFetch";

export default function Login() {
  const [mode, setMode] = useState("login"); // login | forgot
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ email: "", password: "" });
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [tempUser, setTempUser] = useState(null);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotPhone, setForgotPhone] = useState("");
  const [forgotMasked, setForgotMasked] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const reset = () => { setStep(1); setError(""); setSuccess(""); setOtp(""); };

  const redirectUser = (role) => {
    if (role === "shopkeeper") navigate("/shopkeeper/dashboard");
    else if (role === "deliveryBoy") navigate("/delivery/dashboard");
    else if (role === "admin") navigate("/admin/dashboard");
    else navigate("/");
  };

  // ── LOGIN ──
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    const emailErr = validateEmail(form.email);
    const passErr = validateRequired(form.password, "Password");
    if (emailErr) return setError(emailErr);
    if (passErr) return setError(passErr);

    setLoading(true);
    try {
      const res = await safeFetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.message || "Invalid email or password");

      if (data.user.phone) {
        setTempUser(data.user);
        const otpRes = await safeFetch("/api/otp/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: data.user.phone, purpose: "login" }),
        });
        const otpData = await otpRes.json();
        setSuccess(otpData.devOtp ? `Dev OTP: ${otpData.devOtp}` : `OTP sent to ${data.user.phone}`);
        setStep(2);
      } else {
        login(data.user);
        redirectUser(data.user.role);
      }
    } catch (err) {
      setError("Cannot connect to server. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyLoginOTP = async (e) => {
    e.preventDefault();
    setError("");
    if (!otp || otp.length !== 6) return setError("Enter a valid 6-digit OTP");
    setLoading(true);
    try {
      const res = await safeFetch("/api/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: tempUser.phone, otp }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.message || "Invalid OTP");
      login(tempUser);
      redirectUser(tempUser.role);
    } catch {
      setError("OTP verification failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── FORGOT PASSWORD ──
  const handleForgotEmail = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!forgotEmail) return setError("Email is required");
    setLoading(true);
    try {
      const res = await safeFetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.message || "Email not found");
      setForgotPhone(data.phone);
      setForgotMasked(data.masked);
      const otpRes = await safeFetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: data.phone, purpose: "forgot_password" }),
      });
      const otpData = await otpRes.json();
      setSuccess(otpData.devOtp ? `Dev OTP: ${otpData.devOtp}` : `OTP sent to ${data.masked}`);
      setStep(2);
    } catch {
      setError("Cannot connect to server.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyForgotOTP = async (e) => {
    e.preventDefault();
    setError("");
    if (!otp || otp.length !== 6) return setError("Enter a valid 6-digit OTP");
    setLoading(true);
    try {
      const res = await safeFetch("/api/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: forgotPhone, otp }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.message || "Invalid OTP");
      setSuccess("OTP verified! Set your new password.");
      setStep(3);
    } catch {
      setError("OTP verification failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    if (!newPassword) return setError("New password is required");
    if (newPassword.length < 8) return setError("Password must be at least 8 characters");
    if (!/[A-Z]/.test(newPassword)) return setError("Password must contain at least one uppercase letter");
    if (!/[0-9]/.test(newPassword)) return setError("Password must contain at least one number");
    if (newPassword !== confirmPassword) return setError("Passwords do not match");
    setLoading(true);
    try {
      const res = await safeFetch("/api/auth/reset-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.message || "Reset failed");
      setSuccess("✅ Password reset! Redirecting to login...");
      setTimeout(() => { setMode("login"); reset(); setSuccess(""); }, 2000);
    } catch {
      setError("Password reset failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.container}>
      <div style={s.box}>

        {/* LOGIN MODE */}
        {mode === "login" && (
          <>
            <div style={s.logoWrap}>
              <span style={s.logo}>🛒</span>
              <h2 style={s.title}>Welcome Back</h2>
              <p style={s.subtitle}>Login to Apni Dukann</p>
            </div>

            {error && <div style={s.errorBox}>⚠️ {error}</div>}
            {success && <div style={s.successBox}>{success}</div>}

            {step === 1 && (
              <form onSubmit={handleLogin}>
                <label style={s.label}>Email Address</label>
                <input style={s.input} placeholder="you@example.com" type="email"
                  value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />

                <label style={s.label}>Password</label>
                <div style={s.passWrap}>
                  <input style={{ ...s.input, marginBottom: 0, paddingRight: "48px" }}
                    placeholder="Enter your password"
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })} required />
                  <button type="button" style={s.eyeBtn} onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>

                <button type="button" style={s.forgotLink}
                  onClick={() => { setMode("forgot"); reset(); }}>
                  Forgot password?
                </button>

                <button style={{ ...s.btn, opacity: loading ? 0.7 : 1 }} type="submit" disabled={loading}>
                  {loading ? "Logging in..." : "Login →"}
                </button>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handleVerifyLoginOTP}>
                <p style={s.otpInfo}>📱 Enter OTP sent to <strong>{tempUser?.phone}</strong></p>
                <input style={s.otpInput} placeholder="------" value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  maxLength={6} inputMode="numeric" required />
                <button style={{ ...s.btn, opacity: loading ? 0.7 : 1 }} type="submit" disabled={loading}>
                  {loading ? "Verifying..." : "Verify OTP ✓"}
                </button>
                <button type="button" style={s.backBtn} onClick={reset}>← Back</button>
              </form>
            )}

            <p style={s.registerLink}>
              Don't have an account? <Link to="/register" style={{ color: "#ff9900", fontWeight: "bold" }}>Register</Link>
            </p>
          </>
        )}

        {/* FORGOT PASSWORD MODE */}
        {mode === "forgot" && (
          <>
            <div style={s.logoWrap}>
              <span style={s.logo}>🔑</span>
              <h2 style={s.title}>Reset Password</h2>
            </div>

            {/* Step indicators */}
            <div style={s.steps}>
              {["Email", "OTP", "New Password"].map((label, i) => (
                <div key={i} style={s.stepItem}>
                  <div style={{ ...s.stepDot, background: step > i + 1 ? "#27ae60" : step === i + 1 ? "#ff9900" : "#ddd" }}>
                    {step > i + 1 ? "✓" : i + 1}
                  </div>
                  <span style={{ fontSize: "10px", color: step === i + 1 ? "#ff9900" : "#aaa", fontWeight: "bold" }}>{label}</span>
                </div>
              ))}
            </div>

            {error && <div style={s.errorBox}>⚠️ {error}</div>}
            {success && <div style={s.successBox}>{success}</div>}

            {step === 1 && (
              <form onSubmit={handleForgotEmail}>
                <p style={s.hint}>Enter your registered email. We'll send an OTP to your linked phone.</p>
                <label style={s.label}>Registered Email</label>
                <input style={s.input} placeholder="you@example.com" type="email"
                  value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} required />
                <button style={{ ...s.btn, opacity: loading ? 0.7 : 1 }} type="submit" disabled={loading}>
                  {loading ? "Sending..." : "Send OTP →"}
                </button>
                <button type="button" style={s.backBtn} onClick={() => { setMode("login"); reset(); }}>
                  ← Back to Login
                </button>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handleVerifyForgotOTP}>
                <p style={s.otpInfo}>📱 Enter OTP sent to <strong>{forgotMasked}</strong></p>
                <input style={s.otpInput} placeholder="------" value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  maxLength={6} inputMode="numeric" required />
                <button style={{ ...s.btn, opacity: loading ? 0.7 : 1 }} type="submit" disabled={loading}>
                  {loading ? "Verifying..." : "Verify OTP ✓"}
                </button>
                <button type="button" style={s.backBtn} onClick={() => { setStep(1); setError(""); setSuccess(""); }}>
                  ← Back
                </button>
              </form>
            )}

            {step === 3 && (
              <form onSubmit={handleResetPassword}>
                <p style={s.hint}>Enter your new password below.</p>
                <label style={s.label}>New Password</label>
                <input style={s.input} placeholder="Min 8 chars, 1 uppercase, 1 number" type="password"
                  value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
                <label style={s.label}>Confirm Password</label>
                <input style={s.input} placeholder="Repeat new password" type="password"
                  value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                {newPassword && confirmPassword && newPassword !== confirmPassword && (
                  <p style={{ color: "#e74c3c", fontSize: "12px", margin: "-8px 0 12px" }}>Passwords do not match</p>
                )}
                <button style={{ ...s.btn, opacity: loading ? 0.7 : 1 }} type="submit" disabled={loading}>
                  {loading ? "Resetting..." : "Reset Password ✓"}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const s = {
  container: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f5f5", padding: "24px" },
  box: { background: "#fff", padding: "40px 36px", borderRadius: "20px", boxShadow: "0 4px 24px rgba(0,0,0,0.10)", width: "100%", maxWidth: "420px" },
  logoWrap: { textAlign: "center", marginBottom: "28px" },
  logo: { fontSize: "40px" },
  title: { margin: "8px 0 4px", fontSize: "26px", fontWeight: "900", color: "#1a1a1a" },
  subtitle: { margin: 0, fontSize: "14px", color: "#888" },
  label: { display: "block", fontSize: "13px", fontWeight: "700", color: "#444", marginBottom: "6px" },
  input: { width: "100%", padding: "13px 16px", marginBottom: "16px", border: "1.5px solid #e5e5e5", borderRadius: "10px", fontSize: "15px", boxSizing: "border-box", outline: "none", background: "#fafafa", color: "#1a1a1a", transition: "border 0.2s" },
  passWrap: { position: "relative", marginBottom: "8px" },
  eyeBtn: { position: "absolute", right: "14px", top: "13px", background: "none", border: "none", cursor: "pointer", fontSize: "18px" },
  forgotLink: { display: "block", textAlign: "right", background: "none", border: "none", color: "#ff9900", fontSize: "13px", fontWeight: "700", cursor: "pointer", marginBottom: "20px", padding: 0 },
  btn: { width: "100%", padding: "15px", background: "#ff9900", border: "none", borderRadius: "12px", fontWeight: "900", fontSize: "16px", cursor: "pointer", marginBottom: "12px", color: "#fff", transition: "all 0.2s", boxShadow: "0 4px 14px rgba(255,153,0,0.3)" },
  backBtn: { width: "100%", padding: "13px", background: "#f5f5f5", border: "none", borderRadius: "12px", fontWeight: "700", fontSize: "14px", cursor: "pointer", color: "#555" },
  otpInput: { width: "100%", padding: "16px", marginBottom: "16px", border: "1.5px solid #ff9900", borderRadius: "12px", fontSize: "28px", textAlign: "center", letterSpacing: "12px", fontWeight: "900", boxSizing: "border-box", outline: "none", color: "#ff9900", background: "#fff8f0" },
  otpInfo: { textAlign: "center", color: "#555", fontSize: "14px", marginBottom: "20px" },
  hint: { color: "#888", fontSize: "13px", marginBottom: "20px", lineHeight: "1.6" },
  errorBox: { background: "#fff0ed", color: "#c0392b", padding: "12px 16px", borderRadius: "10px", marginBottom: "16px", fontSize: "14px", fontWeight: "600" },
  successBox: { background: "#e8f5e9", color: "#27ae60", padding: "12px 16px", borderRadius: "10px", marginBottom: "16px", fontSize: "14px", fontWeight: "600" },
  registerLink: { textAlign: "center", marginTop: "20px", fontSize: "14px", color: "#888" },
  steps: { display: "flex", justifyContent: "center", gap: "24px", marginBottom: "24px" },
  stepItem: { display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" },
  stepDot: { width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "14px", color: "#fff" },
};
