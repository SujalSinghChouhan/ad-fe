import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { safeFetch } from "../utils/safeFetch";

const STATUS_COLORS = {
  placed:           { background: "#fff3e0", color: "#e65100" },
  accepted:         { background: "#e3f2fd", color: "#1565c0" },
  out_for_delivery: { background: "#f3e5f5", color: "#6a1b9a" },
  delivered:        { background: "#e8f5e9", color: "#2e7d32" },
};

export default function DeliveryDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [available, setAvailable] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [tab, setTab] = useState("available");
  const [verifyingOrder, setVerifyingOrder] = useState(null);
  const [deliveryOtp, setDeliveryOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  useEffect(() => {
    if (!user || user.role !== "deliveryBoy") return navigate("/delivery/login");
    fetchAvailable();
    fetchMyOrders();
  }, [user, navigate]);

  const fetchAvailable = () =>
    fetch("/api/orders/available").then((r) => r.json()).then(setAvailable);

  const fetchMyOrders = () =>
    safeFetch(`/api/orders/delivery/${user.id}`).then((r) => r.json()).then(setMyOrders);

  const pickOrder = async (orderId) => {
    await safeFetch(`/api/orders/${orderId}/status`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "out_for_delivery", deliveryBoyId: user.id, deliveryBoyName: user.name }),
    });
    fetchAvailable(); fetchMyOrders();
  };

  // Step 1: Send OTP to customer before delivery
  const initiateDelivery = async (order) => {
    setVerifyingOrder(order);
    setOtpError(""); setDeliveryOtp(""); setOtpSent(false);
    const res = await safeFetch("/api/otp/send", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: order.phone, purpose: "delivery_verification" }),
    });
    const data = await res.json();
    setOtpSent(true);
    if (data.devOtp) setOtpError(`Dev OTP: ${data.devOtp}`);
  };

  // Step 2: Verify OTP then mark delivered
  const verifyAndDeliver = async () => {
    setOtpError("");
    const res = await safeFetch("/api/otp/verify", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: verifyingOrder.phone, otp: deliveryOtp }),
    });
    const data = await res.json();
    if (!res.ok) return setOtpError(data.message);

    await safeFetch(`/api/orders/${verifyingOrder._id}/status`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "delivered" }),
    });
    setVerifyingOrder(null); setDeliveryOtp("");
    fetchMyOrders();
  };

  const active = myOrders.filter((o) => o.status !== "delivered");
  const completed = myOrders.filter((o) => o.status === "delivered");

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>🛵 Delivery Dashboard</h2>
          <p style={styles.sub}>Welcome, {user?.name}</p>
        </div>
        <button style={styles.logoutBtn} onClick={() => { logout(); navigate("/delivery/login"); }}>Logout</button>
      </div>

      {/* Stats */}
      <div style={styles.stats}>
        <div style={styles.statBox}><span style={styles.statNum}>{available.length}</span><span style={styles.statLabel}>Available</span></div>
        <div style={styles.statBox}><span style={styles.statNum}>{active.length}</span><span style={styles.statLabel}>Active</span></div>
        <div style={styles.statBox}><span style={styles.statNum}>{completed.length}</span><span style={styles.statLabel}>Delivered</span></div>
      </div>

      {/* OTP Verification Modal */}
      {verifyingOrder && (
        <div style={styles.modal}>
          <div style={styles.modalBox}>
            <h3 style={styles.modalTitle}>🔐 Verify Delivery</h3>
            <p style={styles.modalSub}>Ask customer for OTP sent to <strong>{verifyingOrder.phone}</strong></p>
            {!otpSent ? (
              <p style={{ color: "#888", fontSize: "13px" }}>Sending OTP...</p>
            ) : (
              <>
                <input
                  style={styles.otpInput}
                  placeholder="Enter 6-digit OTP"
                  value={deliveryOtp}
                  onChange={(e) => setDeliveryOtp(e.target.value)}
                  maxLength={6}
                />
                {otpError && <p style={{ color: otpError.startsWith("Dev") ? "green" : "red", fontSize: "13px", margin: "4px 0" }}>{otpError}</p>}
                <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
                  <button style={styles.verifyBtn} onClick={verifyAndDeliver}>✅ Verify & Deliver</button>
                  <button style={styles.cancelBtn} onClick={() => setVerifyingOrder(null)}>Cancel</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={styles.tabs}>
        {["available", "active", "completed"].map((t) => (
          <button key={t} onClick={() => setTab(t)}
            style={{ ...styles.tab, background: tab === t ? "#ff9900" : "#fff", color: tab === t ? "#fff" : "#232f3e" }}>
            {t === "available" ? "📦 Available" : t === "active" ? "🛵 Active" : "✅ Completed"}
          </button>
        ))}
      </div>

      {/* Available Orders */}
      {tab === "available" && (
        <div>
          {available.length === 0 ? <p style={styles.empty}>No available orders right now.</p> : available.map((order) => (
            <div key={order._id} style={styles.orderCard}>
              <div style={styles.orderHeader}>
                <span style={styles.orderId}>Order #{order._id.slice(0, 8).toUpperCase()}</span>
                <span style={{ ...styles.statusBadge, ...(STATUS_COLORS[order.status] || {}) }}>{order.status}</span>
              </div>
              <div style={styles.orderInfo}>
                <p>👤 {order.customerName}</p>
                <p>📱 {order.phone}</p>
                <p>📍 {order.deliveryAddress}</p>
                <p>💰 ₹{order.total} — {order.paymentMethod === "cod" ? "💵 COD" : order.paymentMethod === "upi" ? "📱 UPI" : "💳 Card"}</p>
              </div>
              <div style={styles.itemsList}>
                {order.items.map((item, i) => <span key={i} style={styles.itemTag}>{item.productName} x{item.quantity}</span>)}
              </div>
              <button style={styles.pickBtn} onClick={() => pickOrder(order._id)}>🛵 Pick Up & Deliver</button>
            </div>
          ))}
        </div>
      )}

      {/* Active Deliveries */}
      {tab === "active" && (
        <div>
          {active.length === 0 ? <p style={styles.empty}>No active deliveries.</p> : active.map((order) => (
            <div key={order._id} style={styles.orderCard}>
              <div style={styles.orderHeader}>
                <span style={styles.orderId}>Order #{order._id.slice(0, 8).toUpperCase()}</span>
                <span style={{ ...styles.statusBadge, ...(STATUS_COLORS[order.status] || {}) }}>{order.status.replace("_", " ")}</span>
              </div>
              <div style={styles.orderInfo}>
                <p>👤 {order.customerName}</p>
                <p>📱 {order.phone}</p>
                <p>📍 {order.deliveryAddress}</p>
                <p>💰 ₹{order.total}</p>
              </div>
              <button style={styles.deliverBtn} onClick={() => initiateDelivery(order)}>
                🔐 Verify OTP & Mark Delivered
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Completed */}
      {tab === "completed" && (
        <div>
          {completed.length === 0 ? <p style={styles.empty}>No completed deliveries yet.</p> : completed.map((order) => (
            <div key={order._id} style={{ ...styles.orderCard, opacity: 0.8 }}>
              <div style={styles.orderHeader}>
                <span style={styles.orderId}>Order #{order._id.slice(0, 8).toUpperCase()}</span>
                <span style={{ ...styles.statusBadge, ...STATUS_COLORS.delivered }}>✅ Delivered</span>
              </div>
              <div style={styles.orderInfo}>
                <p>👤 {order.customerName}</p>
                <p>📍 {order.deliveryAddress}</p>
                <p>💰 ₹{order.total}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { maxWidth: "800px", margin: "0 auto", padding: "24px" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" },
  title: { color: "#232f3e", margin: 0 },
  sub: { color: "#888", margin: "4px 0 0", fontSize: "14px" },
  logoutBtn: { background: "#e74c3c", color: "#fff", border: "none", padding: "8px 20px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" },
  stats: { display: "flex", gap: "16px", marginBottom: "24px", flexWrap: "wrap" },
  statBox: { background: "#fff", borderRadius: "10px", padding: "16px 28px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", display: "flex", flexDirection: "column", alignItems: "center", flex: 1 },
  statNum: { fontSize: "28px", fontWeight: "bold", color: "#ff9900" },
  statLabel: { fontSize: "12px", color: "#888", marginTop: "4px" },
  tabs: { display: "flex", gap: "10px", marginBottom: "20px" },
  tab: { padding: "8px 20px", border: "1px solid #ff9900", borderRadius: "20px", cursor: "pointer", fontWeight: "bold", fontSize: "13px" },
  orderCard: { background: "#fff", borderRadius: "12px", padding: "20px", marginBottom: "16px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" },
  orderHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" },
  orderId: { fontWeight: "bold", fontSize: "15px", color: "#232f3e" },
  statusBadge: { padding: "4px 12px", borderRadius: "12px", fontSize: "12px", fontWeight: "bold" },
  orderInfo: { fontSize: "14px", color: "#555", lineHeight: "1.8", marginBottom: "12px" },
  itemsList: { display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "14px" },
  itemTag: { background: "#fff3e0", color: "#e65100", padding: "4px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: "bold" },
  pickBtn: { background: "#ff9900", color: "#fff", border: "none", padding: "10px 24px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "14px" },
  deliverBtn: { background: "#27ae60", color: "#fff", border: "none", padding: "10px 24px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "14px" },
  empty: { textAlign: "center", padding: "40px", color: "#888" },
  modal: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 },
  modalBox: { background: "#fff", padding: "32px", borderRadius: "16px", width: "340px", textAlign: "center", boxShadow: "0 8px 32px rgba(0,0,0,0.2)" },
  modalTitle: { color: "#232f3e", margin: "0 0 8px" },
  modalSub: { color: "#555", fontSize: "14px", margin: "0 0 20px" },
  otpInput: { width: "100%", padding: "14px", border: "2px solid #ff9900", borderRadius: "8px", fontSize: "22px", textAlign: "center", letterSpacing: "8px", fontWeight: "bold", boxSizing: "border-box" },
  verifyBtn: { flex: 1, background: "#27ae60", color: "#fff", border: "none", padding: "12px", borderRadius: "6px", fontWeight: "bold", cursor: "pointer", fontSize: "14px" },
  cancelBtn: { flex: 1, background: "#f3f3f3", border: "1px solid #ddd", padding: "12px", borderRadius: "6px", fontWeight: "bold", cursor: "pointer", fontSize: "14px" },
};
