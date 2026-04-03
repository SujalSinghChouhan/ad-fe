import { useNavigate } from "react-router-dom";

export default function ErrorPage({ code = 404, message = "", onRetry = null }) {
  const navigate = useNavigate();

  const config = {
    404: { icon: "🔍", title: "Page Not Found", desc: "The page you're looking for doesn't exist.", color: "#ff9900" },
    500: { icon: "⚠️", title: "Server Error", desc: "Something went wrong on our end. Please try again.", color: "#e74c3c" },
    network: { icon: "📡", title: "No Connection", desc: "Check your internet connection and try again.", color: "#1565c0" },
  };

  const { icon, title, desc, color } = config[code] || config[404];

  return (
    <div style={styles.page}>
      <div style={styles.box}>
        <div style={styles.icon}>{icon}</div>
        <h1 style={{ ...styles.code, color }}>{code === "network" ? "Offline" : code}</h1>
        <h2 style={styles.title}>{title}</h2>
        <p style={styles.desc}>{message || desc}</p>
        <div style={styles.btnRow}>
          {onRetry && (
            <button style={{ ...styles.btn, background: color }} onClick={onRetry}>
              🔄 Retry
            </button>
          )}
          <button style={styles.homeBtn} onClick={() => navigate("/")}>
            🏠 Go Home
          </button>
          <button style={styles.backBtn} onClick={() => navigate(-1)}>
            ← Go Back
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f0f2f5", padding: "24px" },
  box: { background: "#fff", borderRadius: "20px", padding: "48px 40px", textAlign: "center", boxShadow: "0 4px 24px rgba(0,0,0,0.08)", maxWidth: "420px", width: "100%" },
  icon: { fontSize: "72px", marginBottom: "16px" },
  code: { fontSize: "64px", fontWeight: "bold", margin: "0 0 8px" },
  title: { color: "#232f3e", fontSize: "22px", margin: "0 0 12px" },
  desc: { color: "#888", fontSize: "15px", margin: "0 0 28px", lineHeight: "1.6" },
  btnRow: { display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" },
  btn: { color: "#fff", border: "none", padding: "12px 24px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "14px" },
  homeBtn: { background: "#ff9900", color: "#fff", border: "none", padding: "12px 24px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "14px" },
  backBtn: { background: "#f3f3f3", color: "#232f3e", border: "1px solid #ddd", padding: "12px 24px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "14px" },
};
