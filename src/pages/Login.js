import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { validateRequired, validateEmail } from "../utils/validation";

export default function Login() {
  const [mode, setMode] = useState("login"); // login | forgot
  const [step, setStep] = useState(1); // login: 1=form,2=otp | forgot: 1=email,2=otp,3=newpass
  const [form, setForm] = useState({ email: "", password: "" });
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [tempUser, setTempUser] = useState(null);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotPhone, setForgotPhone] = useState("");
  const [forgotMasked, setForgotMasked] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const reset = () => { setStep(1); setError(""); setSuccess(""); setOtp(""); };

  // ── LOGIN FLOW ──
  const handleLogin = async (e) => {
    e.preventDefault(); setError("");
    const emailErr = validateEmail(form.email);
    const passErr = validateRequired(form.password, "Password");
    if (emailErr) return setError(emailErr);
    if (passErr) return setError(passErr);
    try {
      const res = await fetch("http://localhost:5001/api/auth/login", {
        method: "POST", 
        headers: { "Content-Type": "application/json", "Accept": "application/json" }, 
        body: JSON.stringify(form),
      });
      
      // If we don't get JSON back (proxy issue or backend crash)
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (err) {
        console.error("Failed to parse JSON. Raw text:", text);
        return setError("Unexpected response: " + text.slice(0, 60) + "...");
      }

      if (!res.ok) return setError(data.message || "Failed to login");
      
      if (data.user.phone) {
        setTempUser(data.user);
        const otpRes = await fetch("http://localhost:5001/api/otp/send", {
          method: "POST", 
          headers: { "Content-Type": "application/json", "Accept": "application/json" },
          body: JSON.stringify({ phone: data.user.phone, purpose: "login" }),
        });
        const otpData = await otpRes.json();
        if (otpData.devOtp) setSuccess(`Dev OTP: ${otpData.devOtp}`);
        else setSuccess(`OTP sent to ${data.user.phone}`);
        setStep(2);
      } else {
        login(data.user); redirectUser(data.user.role);
      }
    } catch (err) {
      setError("Network error: Could not reach the backend server.");
    }
  };

  const handleVerifyLoginOTP = async (e) => {
    e.preventDefault(); setError("");
    const res = await fetch("/api/otp/verify", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: tempUser.phone, otp }),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.message);
    login(tempUser); redirectUser(tempUser.role);
  };

  const redirectUser = (role) => {
    if (role === "shopkeeper") navigate("/shopkeeper/dashboard");
    else if (role === "deliveryBoy") navigate("/delivery/dashboard");
    else if (role === "admin") navigate("/admin/dashboard");
    else navigate("/");
  };

  // ── FORGOT PASSWORD FLOW ──
  const handleForgotEmail = async (e) => {
    e.preventDefault(); setError(""); setSuccess("");
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: forgotEmail }),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.message);
    setForgotPhone(data.phone);
    setForgotMasked(data.masked);
    // Send OTP
    const otpRes = await fetch("/api/otp/send", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: data.phone, purpose: "forgot_password" }),
    });
    const otpData = await otpRes.json();
    if (otpData.devOtp) setSuccess(`Dev OTP: ${otpData.devOtp}`);
    else setSuccess(`OTP sent to ${data.masked}`);
    setStep(2);
  };

  const handleVerifyForgotOTP = async (e) => {
    e.preventDefault(); setError("");
    const res = await fetch("/api/otp/verify", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: forgotPhone, otp }),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.message);
    setSuccess("OTP verified! Set your new password.");
    setStep(3);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault(); setError("");
    if (!newPassword) return setError("New password is required");
    if (newPassword.length < 8) return setError("Password must be at least 8 characters");
    if (!/[A-Z]/.test(newPassword)) return setError("Password must contain at least one uppercase letter");
    if (!/[0-9]/.test(newPassword)) return setError("Password must contain at least one number");
    if (newPassword !== confirmPassword) return setError("Passwords do not match");
    const res = await fetch("/api/auth/reset-password", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: forgotEmail, newPassword }),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.message);
    setSuccess("✅ Password reset successfully! Redirecting to login...");
    setTimeout(() => { setMode("login"); reset(); setSuccess(""); }, 2000);
  };

  return (
    <div style={styles.container}>
      <div style={styles.box}>

        {/* ── LOGIN MODE ── */}
        {mode === "login" && (
          <>
            <h2 style={styles.title}>🛒 Login to Apni Dukann</h2>
            {error && <p style={styles.error}>{error}</p>}
            {success && <p style={styles.success}>{success}</p>}

            {step === 1 && (
              <form onSubmit={handleLogin}>
                <input style={styles.input} placeholder="📧 Email" type="email" value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                <input style={styles.input} placeholder="🔒 Password" type="password" value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })} required />
                <button style={styles.btn} type="submit">Login</button>
                <button type="button" style={styles.forgotBtn}
                  onClick={() => { setMode("forgot"); reset(); }}>
                  🔑 Forgot Password?
                </button>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handleVerifyLoginOTP}>
                <p style={styles.otpInfo}>📱 Enter OTP sent to <strong>{tempUser?.phone}</strong></p>
                <input style={styles.otpInput} placeholder="------" value={otp}
                  onChange={(e) => setOtp(e.target.value)} maxLength={6} required />
                <button style={styles.btn} type="submit">Verify OTP ✓</button>
                <button type="button" style={styles.backBtn} onClick={reset}>← Back</button>
              </form>
            )}

            <p style={styles.link}>Don't have an account? <Link to="/register">Register</Link></p>
          </>
        )}

        {/* ── FORGOT PASSWORD MODE ── */}
        {mode === "forgot" && (
          <>
            <h2 style={styles.title}>🔑 Reset Password</h2>

            {/* Step indicators */}
            <div style={styles.steps}>
              {["Email", "OTP", "New Password"].map((s, i) => (
                <div key={i} style={styles.stepItem}>
                  <div style={{ ...styles.stepDot, background: step > i + 1 ? "#27ae60" : step === i + 1 ? "#ff9900" : "#ddd", color: "#fff" }}>
                    {step > i + 1 ? "✓" : i + 1}
                  </div>
                  <span style={{ fontSize: "10px", color: step === i + 1 ? "#ff9900" : "#aaa", fontWeight: "bold" }}>{s}</span>
                </div>
              ))}
            </div>

            {error && <p style={styles.error}>{error}</p>}
            {success && <p style={styles.success}>{success}</p>}

            {/* Step 1 - Enter Email */}
            {step === 1 && (
              <form onSubmit={handleForgotEmail}>
                <p style={styles.hint}>Enter your registered email address. We'll send an OTP to your linked phone number.</p>
                <input style={styles.input} placeholder="📧 Registered Email" type="email"
                  value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} required />
                <button style={styles.btn} type="submit">Send OTP →</button>
                <button type="button" style={styles.backBtn} onClick={() => { setMode("login"); reset(); }}>
                  ← Back to Login
                </button>
              </form>
            )}

            {/* Step 2 - Verify OTP */}
            {step === 2 && (
              <form onSubmit={handleVerifyForgotOTP}>
                <p style={styles.otpInfo}>📱 Enter OTP sent to <strong>{forgotMasked}</strong></p>
                <input style={styles.otpInput} placeholder="------" value={otp}
                  onChange={(e) => setOtp(e.target.value)} maxLength={6} required />
                <button style={styles.btn} type="submit">Verify OTP ✓</button>
                <button type="button" style={styles.backBtn} onClick={() => { setStep(1); setError(""); setSuccess(""); }}>
                  ← Back
                </button>
              </form>
            )}

            {/* Step 3 - Set New Password */}
            {step === 3 && (
              <form onSubmit={handleResetPassword}>
                <p style={styles.hint}>Enter your new password below.</p>
                <input style={styles.input} placeholder="🔒 New Password" type="password"
                  value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} />
                <input style={styles.input} placeholder="🔒 Confirm New Password" type="password"
                  value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                {newPassword && confirmPassword && newPassword !== confirmPassword && (
                  <p style={{ color: "red", fontSize: "12px", margin: "-8px 0 8px" }}>Passwords do not match</p>
                )}
                <button style={styles.btn} type="submit">Reset Password ✓</button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--surface)", padding: "24px" },
  box: { background: "var(--surface-lowest)", padding: "48px 40px", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-hover)", width: "100%", maxWidth: "420px" },
  title: { textAlign: "center", marginBottom: "28px", color: "var(--on-surface)", fontFamily: "var(--font-display)", fontSize: "28px", fontWeight: "800", letterSpacing: "-0.02em" },
  steps: { display: "flex", justifyContent: "center", gap: "24px", marginBottom: "24px" },
  stepItem: { display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" },
  stepDot: { width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "14px" },
  input: { width: "100%", padding: "14px 18px", marginBottom: "16px", border: "none", borderRadius: "var(--radius-sm)", fontSize: "15px", boxSizing: "border-box", background: "var(--surface-low)", outline: "none", fontFamily: "var(--font-body)", color: "var(--on-surface)" },
  otpInput: { width: "100%", padding: "16px", marginBottom: "16px", border: "none", borderRadius: "var(--radius-sm)", fontSize: "28px", textAlign: "center", letterSpacing: "12px", fontWeight: "bold", boxSizing: "border-box", background: "var(--surface-low)", outline: "none", color: "var(--primary)" },
  btn: { width: "100%", padding: "16px", background: "var(--primary)", border: "none", borderRadius: "var(--radius-full)", fontWeight: "bold", fontSize: "16px", cursor: "pointer", marginBottom: "12px", color: "var(--on-primary)", fontFamily: "var(--font-display)", boxShadow: "0 8px 20px rgba(0, 106, 40, 0.2)", transition: "all 0.2s" },
  forgotBtn: { width: "100%", padding: "14px", background: "var(--surface-low)", border: "none", borderRadius: "var(--radius-full)", fontWeight: "bold", fontSize: "14px", cursor: "pointer", color: "var(--on-surface)", fontFamily: "var(--font-body)" },
  backBtn: { width: "100%", padding: "14px", background: "var(--surface-low)", border: "none", borderRadius: "var(--radius-full)", fontWeight: "bold", fontSize: "14px", cursor: "pointer", color: "var(--on-surface)", fontFamily: "var(--font-body)" },
  otpInfo: { textAlign: "center", color: "#595c5b", fontSize: "14px", marginBottom: "20px", fontFamily: "var(--font-body)" },
  hint: { color: "#747776", fontSize: "14px", marginBottom: "20px", lineHeight: "1.6", fontFamily: "var(--font-body)" },
  error: { color: "#b02500", marginBottom: "16px", textAlign: "center", fontSize: "14px", fontFamily: "var(--font-body)", background: "#fff0ed", padding: "10px", borderRadius: "var(--radius-sm)" },
  success: { color: "var(--primary)", marginBottom: "16px", textAlign: "center", fontSize: "14px", fontFamily: "var(--font-body)", background: "#e8f5e9", padding: "10px", borderRadius: "var(--radius-sm)" },
  link: { textAlign: "center", marginTop: "20px", fontSize: "14px", color: "#595c5b", fontFamily: "var(--font-body)" },
};
