import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (!user || user.role !== "admin") return navigate("/admin/login");
    fetch("/api/auth/users")
      .then((r) => r.json())
      .then(setUsers);
  }, [user, navigate]);

  const filtered = filter === "all" ? users : users.filter((u) => u.role === filter);
  const customers = users.filter((u) => u.role === "customer");
  const shopkeepers = users.filter((u) => u.role === "shopkeeper");

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h2 style={styles.title}>🛡️ Admin Dashboard</h2>
        <button style={styles.logoutBtn} onClick={() => { logout(); navigate("/admin/login"); }}>Logout</button>
      </div>

      {/* Stats */}
      <div style={styles.stats}>
        <div style={styles.statBox}>
          <span style={styles.statNum}>{users.length}</span>
          <span style={styles.statLabel}>Total Users</span>
        </div>
        <div style={styles.statBox}>
          <span style={styles.statNum}>{customers.length}</span>
          <span style={styles.statLabel}>Customers</span>
        </div>
        <div style={styles.statBox}>
          <span style={styles.statNum}>{shopkeepers.length}</span>
          <span style={styles.statLabel}>Shopkeepers</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={styles.tabs}>
        {["all", "customer", "shopkeeper"].map((tab) => (
          <button key={tab} onClick={() => setFilter(tab)}
            style={{ ...styles.tab, background: filter === tab ? "#ff9900" : "#fff", color: filter === tab ? "#fff" : "#232f3e" }}>
            {tab === "all" ? "All" : tab === "customer" ? "🛍️ Customers" : "🏪 Shopkeepers"}
          </button>
        ))}
      </div>

      {/* Users Grid */}
      <div style={styles.grid}>
        {filtered.map((u) => (
          <div key={u._id} style={styles.card}>
            <div style={{ ...styles.avatar, background: u.role === "shopkeeper" ? "#232f3e" : "#ff9900" }}>
              {u.name[0].toUpperCase()}
            </div>
            <h3 style={styles.name}>{u.name}</h3>
            <p style={styles.email}>📧 {u.email}</p>
            <span style={{ ...styles.badge, background: u.role === "shopkeeper" ? "#e8eaf6" : "#fff3e0", color: u.role === "shopkeeper" ? "#3949ab" : "#e65100" }}>
              {u.role === "shopkeeper" ? "🏪 Shopkeeper" : "🛍️ Customer"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  page: { maxWidth: "1100px", margin: "0 auto", padding: "24px" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" },
  title: { color: "#232f3e", margin: 0 },
  logoutBtn: { background: "#e74c3c", color: "#fff", border: "none", padding: "8px 20px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" },
  stats: { display: "flex", gap: "16px", marginBottom: "24px", flexWrap: "wrap" },
  statBox: { background: "#fff", borderRadius: "10px", padding: "20px 32px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", display: "flex", flexDirection: "column", alignItems: "center" },
  statNum: { fontSize: "28px", fontWeight: "bold", color: "#ff9900" },
  statLabel: { fontSize: "13px", color: "#888", marginTop: "4px" },
  tabs: { display: "flex", gap: "10px", marginBottom: "20px" },
  tab: { padding: "8px 20px", border: "1px solid #ff9900", borderRadius: "20px", cursor: "pointer", fontWeight: "bold", fontSize: "13px" },
  grid: { display: "flex", flexWrap: "wrap", gap: "16px" },
  card: { background: "#fff", borderRadius: "12px", padding: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", textAlign: "center", width: "200px" },
  avatar: { width: "60px", height: "60px", borderRadius: "50%", color: "#fff", fontSize: "26px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", fontWeight: "bold" },
  name: { margin: "0 0 6px", fontSize: "15px", color: "#232f3e" },
  email: { fontSize: "12px", color: "#888", margin: "0 0 10px", wordBreak: "break-all" },
  badge: { padding: "3px 12px", borderRadius: "12px", fontSize: "12px", fontWeight: "bold" },
};
