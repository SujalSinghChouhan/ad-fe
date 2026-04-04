import { useEffect, useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "../context/ToastContext";
import { safeFetch } from "../utils/safeFetch";
import { io } from "socket.io-client";

const SOCKET_URL = process.env.REACT_APP_API_URL || "http://localhost:5002";

export default function Notifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [notifs, setNotifs] = useState([]);
  const [filter, setFilter] = useState("all"); // all | unread | read
  const socketRef = useRef(null);

  const loadNotifs = () => {
    if (!user?.id) return;
    safeFetch(`/api/notifications/${user.id}`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setNotifs(data); })
      .catch(() => {});
  };

  useEffect(() => {
    if (!user || user.role !== "shopkeeper") return navigate("/login");
    loadNotifs();
    socketRef.current = io(SOCKET_URL);
    socketRef.current.emit("join_shopkeeper", { shopkeeperId: user.id });
    socketRef.current.on("new_order_notification", () => {
      loadNotifs();
      addToast("🛒 New order received!", "success");
    });
    return () => socketRef.current?.disconnect();
  }, [user, navigate]);

  const acceptOrder = async (orderId, notifId) => {
    try {
      await safeFetch(`/api/orders/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "accepted" }),
      });
      await safeFetch(`/api/notifications/${notifId}/read`, { method: "PUT" });
      setNotifs((prev) =>
        prev.map((n) => (n._id === notifId ? { ...n, read: true, accepted: true } : n))
      );
      addToast("✅ Order accepted! Delivery boy will be assigned shortly.", "success");
    } catch {
      addToast("❌ Failed to accept order. Try again.", "error");
    }
  };

  const rejectOrder = async (orderId, notifId) => {
    if (!window.confirm("Reject this order?")) return;
    try {
      await safeFetch(`/api/orders/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });
      await safeFetch(`/api/notifications/${notifId}/read`, { method: "PUT" });
      setNotifs((prev) =>
        prev.map((n) => (n._id === notifId ? { ...n, read: true, rejected: true } : n))
      );
      addToast("🚫 Order rejected.", "error");
    } catch {
      addToast("❌ Failed to reject order. Try again.", "error");
    }
  };

  const unreadCount = notifs.filter((n) => !n.read).length;
  const filtered = notifs.filter((n) => {
    if (filter === "unread") return !n.read;
    if (filter === "read") return n.read;
    return true;
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-black text-gray-900">🔔 Order Notifications</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {unreadCount > 0 ? `${unreadCount} new order${unreadCount > 1 ? "s" : ""} waiting` : "All caught up!"}
          </p>
        </div>
        {unreadCount > 0 && (
          <span className="bg-orange-500 text-white text-sm font-black px-3 py-1 rounded-full">
            {unreadCount} New
          </span>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4">
        {["all", "unread", "read"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-bold capitalize transition-all ${
              filter === f
                ? "bg-orange-500 text-white"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            {f} {f === "unread" && unreadCount > 0 ? `(${unreadCount})` : ""}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-5xl mb-3">🔔</p>
          <p className="font-medium">No notifications here yet.</p>
          <p className="text-sm mt-1">When customers place orders, you'll see them here.</p>
        </div>
      ) : (
        filtered.map((n) => {
          const isNew = !n.read;
          const isRejected = n.rejected;
          const isAccepted = n.accepted || (n.read && !n.rejected);
          return (
            <div
              key={n._id}
              className={`rounded-2xl p-4 mb-3 border-l-4 shadow-sm transition-all ${
                isNew
                  ? "bg-orange-50 border-orange-400"
                  : isRejected
                  ? "bg-red-50 border-red-300"
                  : "bg-white border-green-400"
              }`}
            >
              {/* Top row */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{
                    background: isNew ? "#fff3e0" : isRejected ? "#ffebee" : "#e8f5e9",
                    color: isNew ? "#e65100" : isRejected ? "#c62828" : "#2e7d32",
                  }}>
                  {isNew ? "🆕 New Order" : isRejected ? "🚫 Rejected" : "✅ Accepted"}
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(n.createdAt).toLocaleString("en-IN", {
                    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                  })}
                </span>
              </div>

              {/* Order ID */}
              {n.orderId && (
                <p className="text-xs text-gray-400 font-mono mb-1">
                  Order ID: <span className="text-gray-600 font-semibold">{n.orderId}</span>
                </p>
              )}

              {/* Message */}
              <p className="text-sm text-gray-700 leading-relaxed mb-3">{n.message}</p>

              {/* Action Buttons */}
              {isNew && (
                <div className="flex gap-2">
                  <button
                    onClick={() => acceptOrder(n.orderId, n._id)}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white text-sm font-bold py-2 rounded-xl active:scale-95 transition-all"
                  >
                    ✅ Accept Order
                  </button>
                  <button
                    onClick={() => rejectOrder(n.orderId, n._id)}
                    className="flex-1 bg-red-100 hover:bg-red-200 text-red-600 text-sm font-bold py-2 rounded-xl active:scale-95 transition-all"
                  >
                    🚫 Reject
                  </button>
                </div>
              )}
              {!isNew && (
                <p className={`text-xs font-bold ${isRejected ? "text-red-500" : "text-green-600"}`}>
                  {isRejected ? "🚫 You rejected this order" : "✅ You accepted this order"}
                </p>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
