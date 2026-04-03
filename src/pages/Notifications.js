import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "../context/ToastContext";
import { safeFetch } from "../utils/safeFetch";

export default function Notifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [notifs, setNotifs] = useState([]);

  useEffect(() => {
    if (!user || user.role !== "shopkeeper") return navigate("/login");
    safeFetch(`/api/notifications/${user.id}`)
      .then((r) => r.json())
      .then(setNotifs);
  }, [user, navigate]);

  const acceptOrder = async (orderId, notifId) => {
    await safeFetch(`/api/orders/${orderId}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "accepted" }),
    });
    await safeFetch(`/api/notifications/${notifId}/read`, { method: "PUT" });
    setNotifs((prev) => prev.map((n) => n._id === notifId ? { ...n, read: true, accepted: true } : n));
    addToast("✅ Order accepted! Delivery boy will be assigned shortly.", "success");
  };

  return (
    <div style={styles.page}>
      <h2 style={styles.title}>🔔 Order Notifications</h2>
      {notifs.length === 0 ? (
        <p style={styles.empty}>No notifications yet. When customers order your products, you'll see them here!</p>
      ) : (
        notifs.map((n) => (
          <div key={n._id} style={{ ...styles.card, background: n.read ? "#fff" : "#fff8e1" }}>
            <div style={styles.cardHeader}>
              <span>{n.read ? "✅" : "🆕"}</span>
              <span style={styles.date}>{new Date(n.createdAt).toLocaleString()}</span>
            </div>
            <p style={styles.message}>{n.message}</p>
            {!n.read && (
              <button style={styles.acceptBtn} onClick={() => acceptOrder(n.orderId, n._id)}>
                ✅ Accept Order
              </button>
            )}
            {n.read && <span style={styles.acceptedTag}>✅ Order Accepted</span>}
          </div>
        ))
      )}
    </div>
  );
}

const styles = {
  page: { maxWidth: "700px", margin: "0 auto", padding: "24px" },
  title: { color: "#232f3e" },
  card: { borderRadius: "8px", padding: "16px", marginBottom: "12px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", borderLeft: "4px solid #ff9900" },
  cardHeader: { display: "flex", justifyContent: "space-between", marginBottom: "8px" },
  date: { color: "#888", fontSize: "12px" },
  message: { margin: "0 0 10px", fontSize: "14px", color: "#333" },
  acceptBtn: { background: "#27ae60", color: "#fff", border: "none", padding: "8px 20px", borderRadius: "4px", cursor: "pointer", fontWeight: "bold", fontSize: "13px" },
  acceptedTag: { color: "#27ae60", fontWeight: "bold", fontSize: "13px" },
  empty: { textAlign: "center", padding: "60px", color: "#888" },
};
