import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Line, Bar, Doughnut, Pie } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler } from "chart.js";
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("all");
  const [tab, setTab] = useState("dashboard");

  useEffect(() => {
    if (!user || user.role !== "admin") return navigate("/admin/login");
    fetch("/api/auth/users").then((r) => r.json()).then(setUsers);
    fetch("/api/orders/all").then((r) => r.json()).then(setOrders);
  }, [user, navigate]);

  const customers = users.filter((u) => u.role === "customer");
  const shopkeepers = users.filter((u) => u.role === "shopkeeper");
  const deliveryBoys = users.filter((u) => u.role === "deliveryBoy");
  const filtered = filter === "all" ? users : users.filter((u) => u.role === filter);

  const STATUS_COLORS = {
    placed:           { background: "#fff3e0", color: "#e65100" },
    accepted:         { background: "#e3f2fd", color: "#1565c0" },
    out_for_delivery: { background: "#f3e5f5", color: "#6a1b9a" },
    delivered:        { background: "#e8f5e9", color: "#2e7d32" },
  };

  return (
    <div style={styles.wrapper}>

      {/* Admin Navbar */}
      <nav style={styles.navbar}>
        <span style={styles.brand}>🛡️ Admin Panel</span>
        <div style={styles.navLinks}>
          <button onClick={() => setTab("dashboard")} style={{ ...styles.navBtn, background: tab === "dashboard" ? "#ff9900" : "transparent" }}>
            📊 Dashboard
          </button>
          <button onClick={() => setTab("users")} style={{ ...styles.navBtn, background: tab === "users" ? "#ff9900" : "transparent" }}>
            👥 Users
          </button>
          <button onClick={() => setTab("orders")} style={{ ...styles.navBtn, background: tab === "orders" ? "#ff9900" : "transparent" }}>
            📦 Orders
          </button>
          <button onClick={() => setTab("analytics")} style={{ ...styles.navBtn, background: tab === "analytics" ? "#ff9900" : "transparent" }}>
            📊 Analytics
          </button>
        </div>
        <div style={styles.navRight}>
          <span style={styles.adminName}>👤 {user?.name}</span>
          <button style={styles.logoutBtn} onClick={() => { logout(); navigate("/admin/login"); }}>Logout</button>
        </div>
      </nav>

      <div style={styles.page}>

        {/* Dashboard Tab */}
        {tab === "dashboard" && (
          <>
            <h2 style={styles.title}>📊 Overview</h2>
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
              <div style={styles.statBox}>
                <span style={styles.statNum}>{deliveryBoys.length}</span>
                <span style={styles.statLabel}>Delivery Boys</span>
              </div>
              <div style={styles.statBox}>
                <span style={styles.statNum}>{orders.length}</span>
                <span style={styles.statLabel}>Total Orders</span>
              </div>
              <div style={styles.statBox}>
                <span style={styles.statNum}>₹{orders.reduce((s, o) => s + (o.total || 0), 0).toLocaleString()}</span>
                <span style={styles.statLabel}>Total Revenue</span>
              </div>
            </div>

            {/* Recent Orders */}
            <h3 style={styles.sectionTitle}>🕐 Recent Orders</h3>
            {orders.slice(0, 5).map((order) => (
              <div key={order._id} style={styles.orderCard}>
                <div style={styles.orderRow}>
                  <span style={styles.orderId}>#{order._id.slice(0, 8).toUpperCase()}</span>
                  <span>{order.customerName}</span>
                  <span>📱 {order.phone}</span>
                  <span>💰 ₹{order.total}</span>
                  <span style={{ ...styles.statusBadge, ...(STATUS_COLORS[order.status] || STATUS_COLORS.placed) }}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </>
        )}

        {/* Users Tab */}
        {tab === "users" && (
          <>
            <h2 style={styles.title}>👥 All Users</h2>
            <div style={styles.tabs}>
              {["all", "customer", "shopkeeper", "deliveryBoy"].map((t) => (
                <button key={t} onClick={() => setFilter(t)}
                  style={{ ...styles.tab, background: filter === t ? "#ff9900" : "#fff", color: filter === t ? "#fff" : "#232f3e" }}>
                  {t === "all" ? "All" : t === "customer" ? "🛍️ Customers" : t === "shopkeeper" ? "🏪 Shopkeepers" : "🛵 Delivery Boys"}
                </button>
              ))}
            </div>
            <div style={styles.grid}>
              {filtered.map((u) => (
                <div key={u._id} style={styles.card}>
                  <div style={{ ...styles.avatar, background: u.role === "shopkeeper" ? "#232f3e" : u.role === "deliveryBoy" ? "#27ae60" : "#ff9900" }}>
                    {u.name[0].toUpperCase()}
                  </div>
                  <h3 style={styles.name}>{u.name}</h3>
                  <p style={styles.email}>📧 {u.email}</p>
                  <span style={{ ...styles.badge, background: u.role === "shopkeeper" ? "#e8eaf6" : u.role === "deliveryBoy" ? "#e8f5e9" : "#fff3e0", color: u.role === "shopkeeper" ? "#3949ab" : u.role === "deliveryBoy" ? "#2e7d32" : "#e65100" }}>
                    {u.role === "shopkeeper" ? "🏪 Shopkeeper" : u.role === "deliveryBoy" ? "🛵 Delivery Boy" : "🛍️ Customer"}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Orders Tab */}
        {tab === "orders" && (
          <>
            <h2 style={styles.title}>📦 All Orders</h2>
            {orders.length === 0 ? <p style={styles.empty}>No orders yet.</p> : orders.map((order) => (
              <div key={order._id} style={styles.orderCard}>
                <div style={styles.orderHeader}>
                  <span style={styles.orderId}>#{order._id.slice(0, 8).toUpperCase()}</span>
                  <span style={{ ...styles.statusBadge, ...(STATUS_COLORS[order.status] || STATUS_COLORS.placed) }}>{order.status}</span>
                  <span style={styles.orderDate}>{new Date(order.createdAt).toLocaleDateString("en-IN")}</span>
                </div>
                <div style={styles.orderInfo}>
                  <span>👤 {order.customerName}</span>
                  <span>📱 {order.phone}</span>
                  <span>📍 {order.deliveryAddress}</span>
                  <span>💰 ₹{order.total}</span>
                  {order.deliveryBoyName && <span>🛵 {order.deliveryBoyName}</span>}
                </div>
                <div style={styles.itemsList}>
                  {order.items.map((item, i) => (
                    <span key={i} style={styles.itemTag}>{item.productName} x{item.quantity}</span>
                  ))}
                </div>
              </div>
            ))}
          </>
        )}
        {/* Analytics Tab */}
        {tab === "analytics" && (() => {
          const last7 = [...Array(7)].map((_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric" }); });
          const ordersPerDay = last7.map((_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); return orders.filter(o => new Date(o.createdAt).toDateString() === d.toDateString()).length; });
          const revenuePerDay = last7.map((_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); return orders.filter(o => new Date(o.createdAt).toDateString() === d.toDateString()).reduce((s, o) => s + o.total, 0); });
          const productCount = {};
          orders.forEach(o => o.items?.forEach(i => { productCount[i.productName] = (productCount[i.productName] || 0) + i.quantity; }));
          const topProducts = Object.entries(productCount).sort((a, b) => b[1] - a[1]).slice(0, 5);
          const statusCount = { placed: 0, accepted: 0, out_for_delivery: 0, delivered: 0, cancelled: 0 };
          orders.forEach(o => { if (statusCount[o.status] !== undefined) statusCount[o.status]++; });
          return (
            <>
              <h2 style={styles.title}>📊 Analytics Dashboard</h2>
              <div style={styles.chartsGrid}>
                <div style={styles.chartBox}>
                  <h3 style={styles.chartTitle}>📈 Orders - Last 7 Days</h3>
                  <Line data={{ labels: last7, datasets: [{ label: "Orders", data: ordersPerDay, borderColor: "#ff9900", backgroundColor: "rgba(255,153,0,0.1)", fill: true, tension: 0.4 }] }} options={{ responsive: true, plugins: { legend: { display: false } } }} />
                </div>
                <div style={styles.chartBox}>
                  <h3 style={styles.chartTitle}>💰 Revenue - Last 7 Days</h3>
                  <Bar data={{ labels: last7, datasets: [{ label: "Revenue (₹)", data: revenuePerDay, backgroundColor: "rgba(35,47,62,0.8)", borderRadius: 6 }] }} options={{ responsive: true, plugins: { legend: { display: false } } }} />
                </div>
                <div style={styles.chartBox}>
                  <h3 style={styles.chartTitle}>🍩 Order Status</h3>
                  <Doughnut data={{ labels: ["Placed", "Accepted", "Out for Delivery", "Delivered", "Cancelled"], datasets: [{ data: Object.values(statusCount), backgroundColor: ["#ff9900", "#1565c0", "#6a1b9a", "#27ae60", "#e74c3c"] }] }} options={{ responsive: true }} />
                </div>
                <div style={styles.chartBox}>
                  <h3 style={styles.chartTitle}>🧑 User Roles</h3>
                  <Pie data={{ labels: ["Customers", "Shopkeepers", "Delivery Boys"], datasets: [{ data: [customers.length, shopkeepers.length, deliveryBoys.length], backgroundColor: ["#ff9900", "#232f3e", "#27ae60"] }] }} options={{ responsive: true }} />
                </div>
              </div>
              {topProducts.length > 0 && (
                <div style={styles.chartBox}>
                  <h3 style={styles.chartTitle}>🏆 Top Selling Products</h3>
                  <Bar data={{ labels: topProducts.map(([name]) => name.slice(0, 25)), datasets: [{ label: "Units Sold", data: topProducts.map(([, qty]) => qty), backgroundColor: "rgba(255,153,0,0.8)", borderRadius: 6 }] }} options={{ responsive: true, plugins: { legend: { display: false } }, indexAxis: "y" }} />
                </div>
              )}
            </>
          );
        })()}

      </div>
    </div>
  );
}

const styles = {
  wrapper: { minHeight: "100vh", background: "#f3f3f3" },
  navbar: { display: "flex", justifyContent: "space-between", alignItems: "center", background: "#232f3e", padding: "12px 24px", position: "sticky", top: 0, zIndex: 100 },
  brand: { color: "#ff9900", fontSize: "20px", fontWeight: "bold" },
  navLinks: { display: "flex", gap: "8px" },
  navBtn: { color: "#fff", border: "none", padding: "8px 16px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "13px" },
  navRight: { display: "flex", alignItems: "center", gap: "12px" },
  adminName: { color: "#ccc", fontSize: "13px" },
  logoutBtn: { background: "#e74c3c", color: "#fff", border: "none", padding: "6px 16px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" },
  page: { maxWidth: "1100px", margin: "0 auto", padding: "24px" },
  title: { color: "#232f3e", marginBottom: "20px" },
  sectionTitle: { color: "#232f3e", margin: "24px 0 12px" },
  stats: { display: "flex", gap: "16px", marginBottom: "24px", flexWrap: "wrap" },
  statBox: { background: "#fff", borderRadius: "10px", padding: "20px 28px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", display: "flex", flexDirection: "column", alignItems: "center", flex: 1, minWidth: "140px" },
  statNum: { fontSize: "26px", fontWeight: "bold", color: "#ff9900" },
  statLabel: { fontSize: "12px", color: "#888", marginTop: "4px" },
  tabs: { display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap" },
  tab: { padding: "8px 20px", border: "1px solid #ff9900", borderRadius: "20px", cursor: "pointer", fontWeight: "bold", fontSize: "13px" },
  grid: { display: "flex", flexWrap: "wrap", gap: "16px" },
  card: { background: "#fff", borderRadius: "12px", padding: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", textAlign: "center", width: "200px" },
  avatar: { width: "60px", height: "60px", borderRadius: "50%", color: "#fff", fontSize: "26px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", fontWeight: "bold" },
  name: { margin: "0 0 6px", fontSize: "15px", color: "#232f3e" },
  email: { fontSize: "12px", color: "#888", margin: "0 0 10px", wordBreak: "break-all" },
  badge: { padding: "3px 12px", borderRadius: "12px", fontSize: "12px", fontWeight: "bold" },
  orderCard: { background: "#fff", borderRadius: "10px", padding: "16px", marginBottom: "12px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" },
  orderRow: { display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap", fontSize: "14px" },
  orderHeader: { display: "flex", gap: "16px", alignItems: "center", marginBottom: "10px", flexWrap: "wrap" },
  orderInfo: { display: "flex", gap: "16px", fontSize: "13px", color: "#555", flexWrap: "wrap", marginBottom: "10px" },
  orderId: { fontWeight: "bold", color: "#232f3e" },
  orderDate: { color: "#888", fontSize: "12px" },
  statusBadge: { padding: "3px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: "bold" },
  itemsList: { display: "flex", flexWrap: "wrap", gap: "6px" },
  itemTag: { background: "#fff3e0", color: "#e65100", padding: "3px 10px", borderRadius: "12px", fontSize: "12px" },
  empty: { textAlign: "center", padding: "40px", color: "#888" },
  chartsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "20px", marginBottom: "20px" },
  chartBox: { background: "#fff", borderRadius: "12px", padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" },
  chartTitle: { color: "#232f3e", fontSize: "15px", margin: "0 0 16px", fontWeight: "bold" },
};
