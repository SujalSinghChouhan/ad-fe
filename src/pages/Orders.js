import { useEffect, useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { downloadInvoice } from "../utils/invoice";
import { useToast } from "../context/ToastContext";
import { safeFetch } from "../utils/safeFetch";
import { io } from "socket.io-client";
import DeliveryMap from "../components/DeliveryMap";

const SOCKET_URL = process.env.REACT_APP_API_URL || "http://localhost:5002";

const STATUS_COLORS = {
  placed:           { background: "#fff3e0", color: "#e65100" },
  accepted:         { background: "#e3f2fd", color: "#1565c0" },
  out_for_delivery: { background: "#f3e5f5", color: "#6a1b9a" },
  delivered:        { background: "#e8f5e9", color: "#2e7d32" },
  cancelled:        { background: "#ffebee", color: "#c62828" },
};

const STATUS_STEPS = ["placed", "accepted", "out_for_delivery", "delivered"];

export default function Orders() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState("active");
  const [cancelling, setCancelling] = useState(null);
  const prevStatusRef = useRef({});
  const socketRef = useRef(null);
  const ordersRef = useRef([]);

  const fetchOrders = () => {
    if (!user?.id) return;
    safeFetch(`/api/orders/customer/${user.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (!Array.isArray(data)) return;
        ordersRef.current = data;
        setOrders(data);
      })
      .catch(() => {});
  };

  const fetchOrdersThen = (cb) => {
    if (!user?.id) return;
    safeFetch(`/api/orders/customer/${user.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (!Array.isArray(data)) return;
        ordersRef.current = data;
        setOrders(data);
        cb && cb();
      })
      .catch(() => {});
  };

  useEffect(() => {
    if (!user) return navigate("/login");
    fetchOrders();

    // Socket: join customer room for real-time order status updates
    socketRef.current = io(SOCKET_URL);
    socketRef.current.emit("join_customer", { customerId: user.id });
    socketRef.current.on("order_status_update", (data) => {
      const toastTypes = { accepted: "success", out_for_delivery: "delivery", delivered: "success", cancelled: "error" };
      addToast(data.message, toastTypes[data.status] || "info", 8000);
      fetchOrders();
    });

    // Keep polling as fallback every 30s
    const interval = setInterval(fetchOrders, 30000);
    return () => { clearInterval(interval); socketRef.current?.disconnect(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, navigate]);

  const cancelOrder = async (orderId, status) => {
    if (!window.confirm(status === "out_for_delivery"
      ? "⚠️ Delivery boy has already picked up your order! Cancelling now will add a ₹30 penalty to your next order. Continue?"
      : "Are you sure you want to cancel this order?"
    )) return;
    setCancelling(orderId);
    const res = await safeFetch(`/api/orders/${orderId}/cancel`, { method: "PUT" });
    const data = await res.json();
    setCancelling(null);
    if (res.ok) {
      if (data.cancelledAfterPickup) alert("Order cancelled. ₹30 penalty has been added to your next order.");
      fetchOrders();
    }
  };

  // Get unique shopkeepers per order
  const getShopkeepers = (items) => {
    const map = {};
    items.forEach((item) => {
      if (item.shopkeeperId && !map[item.shopkeeperId]) {
        map[item.shopkeeperId] = {
          name: item.shopkeeperName,
          address: item.shopkeeperAddress,
        };
      }
    });
    return Object.values(map);
  };

  // Build Google Maps directions URL from shop to user
  const getRouteUrl = (shopAddress, userAddress) => {
    if (!shopAddress || !userAddress) return null;
    return `https://www.google.com/maps/dir/${encodeURIComponent(shopAddress)}/${encodeURIComponent(userAddress)}`;
  };

  return (
    <div style={styles.page}>
      <h2 style={styles.title}>📦 My Orders</h2>

      {/* Tabs */}
      <div style={styles.tabs}>
        {["active", "history"].map((t) => (
          <button key={t} onClick={() => setTab(t)}
            style={{ ...styles.tab, background: tab === t ? "#ff9900" : "#fff", color: tab === t ? "#fff" : "#232f3e" }}>
            {t === "active" ? "📦 Active Orders" : "✅ Order History"}
            <span style={styles.tabCount}>
              {t === "active" ? orders.filter(o => o.status !== "delivered" && o.status !== "cancelled").length : orders.filter(o => o.status === "delivered" || o.status === "cancelled").length}
            </span>
          </button>
        ))}
      </div>

      {orders.length === 0 ? (
        <p style={styles.empty}>No orders yet. <span style={{ color: "#ff9900", cursor: "pointer" }} onClick={() => navigate("/")}>Start shopping!</span></p>
      ) : (
        orders
          .filter((order) => tab === "active" ? (order.status !== "delivered" && order.status !== "cancelled") : (order.status === "delivered" || order.status === "cancelled"))
          .length === 0 ? (
            <p style={styles.empty}>{tab === "active" ? "No active orders." : "No order history yet."}</p>
          ) : (
        orders
          .filter((order) => tab === "active" ? (order.status !== "delivered" && order.status !== "cancelled") : (order.status === "delivered" || order.status === "cancelled"))
          .map((order) => {
          const shopkeepers = getShopkeepers(order.items);
          const primaryShop = shopkeepers[0];
          const statusIndex = STATUS_STEPS.indexOf(order.status);

          return (
            <div key={order._id} style={styles.orderCard}>

              {/* Order Header */}
              <div style={styles.orderHeader}>
                <div>
                  <span style={styles.orderId}>Order #{(order._id || "").slice(0, 8).toUpperCase()}</span>
                  <span style={styles.date}>{new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                </div>
                <span style={{ ...styles.statusBadge, ...(STATUS_COLORS[order.status] || STATUS_COLORS.placed) }}>
                  {order.status === "out_for_delivery" ? "🛵 Out for Delivery" :
                   order.status === "delivered" ? "✅ Delivered" :
                   order.status === "accepted" ? "✅ Accepted" :
                   order.status === "cancelled" ? "❌ Cancelled" : "📦 Placed"}
                </span>
              </div>

              {/* Progress Bar */}
              <div style={styles.progressBar}>
                {STATUS_STEPS.map((s, i) => (
                  <div key={s} style={styles.progressStep}>
                    <div style={{ ...styles.progressDot, background: i <= statusIndex ? "#ff9900" : "#ddd" }}>
                      {i < statusIndex ? "✓" : i === statusIndex ? "●" : "○"}
                    </div>
                    <span style={{ ...styles.progressLabel, color: i <= statusIndex ? "#ff9900" : "#aaa" }}>
                      {s === "placed" ? "Placed" : s === "accepted" ? "Accepted" : s === "out_for_delivery" ? "On Way" : "Delivered"}
                    </span>
                    {i < STATUS_STEPS.length - 1 && (
                      <div style={{ ...styles.progressLine, background: i < statusIndex ? "#ff9900" : "#ddd" }} />
                    )}
                  </div>
                ))}
              </div>

              {/* Shop Info */}
              {shopkeepers.map((shop, i) => (
                <div key={i} style={styles.shopBox}>
                  <div style={styles.shopLeft}>
                    <span style={styles.shopIcon}>🏪</span>
                    <div>
                      <p style={styles.shopName}>{shop.name}</p>
                      {shop.address && <p style={styles.shopAddr}>📍 {shop.address}</p>}
                    </div>
                  </div>
                </div>
              ))}

              {/* Delivery & Contact Info */}
              <div style={styles.infoBox}>
                {order.phone && <span>📱 {order.phone}</span>}
                {order.deliveryAddress && <span>📍 {order.deliveryAddress}</span>}
                {order.paymentMethod && <span>{order.paymentMethod === "cod" ? "💵 Cash on Delivery" : order.paymentMethod === "upi" ? "📱 UPI" : "💳 Card"}</span>}
              </div>

              {/* Delivery Boy Info */}
              {order.deliveryBoyName && (
                <div style={styles.deliveryBoyBox}>
                  <span>🛵 Delivery Boy: <strong>{order.deliveryBoyName}</strong></span>
                  <span style={styles.deliveryBoyStatus}> — {order.status === "delivered" ? "Delivered your order ✅" : "Currently delivering your order"}</span>
                </div>
              )}

              {/* OTP Box: shown when out for delivery */}
              {order.status === "out_for_delivery" && (
                <div style={styles.otpBox}>
                  <p style={{ margin: "0 0 6px", fontWeight: "bold", fontSize: "14px", color: "#232f3e" }}>🔐 Your Delivery OTP</p>
                  <p style={{ margin: "0 0 10px", fontSize: "12px", color: "#555" }}>Show this OTP to the delivery boy to confirm delivery</p>
                  {order.deliveryOtp ? (
                    <div style={styles.otpCode}>{order.deliveryOtp}</div>
                  ) : (
                    <p style={{ fontSize: "13px", color: "#888" }}>OTP will appear here once delivery boy picks up your order</p>
                  )}
                </div>
              )}

              {/* Products */}
              <div style={styles.itemsSection}>
                {order.items.map((item, i) => (
                  <div key={i} style={styles.productCard}>
                    <div style={styles.productLeft}>
                      <div style={styles.productIcon}>🛍️</div>
                      <div>
                        <p style={styles.productName}>{item.productName || item.name}</p>
                        <p style={styles.shopNameSmall}>🏪 {item.shopkeeperName}</p>
                        {item.shopkeeperAddress && <p style={styles.shopAddrSmall}>📍 {item.shopkeeperAddress}</p>}
                      </div>
                    </div>
                    <div style={styles.productRight}>
                      <p style={styles.productQty}>Qty: {item.quantity}</p>
                      <p style={styles.productPrice}>₹{item.price} × {item.quantity}</p>
                      <p style={styles.productTotal}>= ₹{item.price * item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Timeline */}
              {order.timeline && order.timeline.length > 0 && (
                <div style={styles.timelineBox}>
                  <p style={styles.timelineTitle}>📅 Order Timeline</p>
                  {order.timeline.map((t, i) => (
                    <div key={i} style={styles.timelineItem}>
                      <div style={styles.timelineDot} />
                      {i < order.timeline.length - 1 && <div style={styles.timelineLine} />}
                      <div style={styles.timelineContent}>
                        <span style={styles.timelineStatus}>{t.status?.replace("_", " ").toUpperCase()}</span>
                        <span style={styles.timelineNote}>{t.note}</span>
                        <span style={styles.timelineTime}>{new Date(t.time).toLocaleString("en-IN")}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Route Map: Shop → Customer using Leaflet */}
              {primaryShop?.address && order.deliveryAddress && (
                <DeliveryMap
                  shopAddress={primaryShop.address}
                  customerAddress={order.deliveryAddress}
                  shopName={primaryShop.name}
                  mode="customer"
                />
              )}

              {/* Cancel Button */}
              {order.status !== "delivered" && order.status !== "cancelled" && (
                <div style={styles.cancelSection}>
                  {order.status === "out_for_delivery" && (
                    <p style={styles.penaltyWarning}>⚠️ Delivery boy has picked up your order. Cancelling will add ₹30 penalty to next order.</p>
                  )}
                  <button
                    style={styles.cancelBtn}
                    onClick={() => cancelOrder(order._id, order.status)}
                    disabled={cancelling === order._id}
                  >
                    {cancelling === order._id ? "Cancelling..." : "❌ Cancel Order"}
                  </button>
                </div>
              )}

              {/* Cancelled Info */}
              {order.status === "cancelled" && (
                <div style={styles.cancelledBox}>
                  <p style={styles.cancelledText}>❌ This order was cancelled</p>
                  {order.cancelledAfterPickup && (
                    <p style={styles.penaltyText}>⚠️ ₹30 penalty was added to your next order (cancelled after pickup)</p>
                  )}
                </div>
              )}

              {/* Order Footer */}
              <div style={styles.orderFooter}>
                <div style={styles.billBox}>
                  <div style={styles.billRow}>
                    <span>🛍️ Items ({order.items.length})</span>
                    <span>₹{order.items.reduce((s, i) => s + i.price * i.quantity, 0)}</span>
                  </div>
                  {order.deliveryCharge > 0 && (
                    <div style={styles.billRow}>
                      <span>🚚 Delivery Charge</span>
                      <span>₹{order.deliveryCharge}</span>
                    </div>
                  )}
                  {order.deliveryCharge === 0 && (
                    <div style={styles.billRow}>
                      <span>🚚 Delivery Charge</span>
                      <span style={{ color: "#27ae60", fontWeight: "bold" }}>FREE 🎉</span>
                    </div>
                  )}
                  {order.discount > 0 && (
                    <div style={styles.billRow}>
                      <span>🎟️ Coupon {order.couponCode && <span style={styles.couponTag}>{order.couponCode}</span>}</span>
                      <span style={{ color: "#27ae60", fontWeight: "bold" }}>-₹{order.discount}</span>
                    </div>
                  )}
                  {order.penaltyCharge > 0 && (
                    <div style={styles.billRow}>
                      <span>⚠️ Penalty Charge</span>
                      <span style={{ color: "#e74c3c", fontWeight: "bold" }}>₹{order.penaltyCharge}</span>
                    </div>
                  )}
                  <div style={styles.billTotal}>
                    <span>💰 Grand Total</span>
                    <span style={{ color: "#ff9900", fontWeight: "bold", fontSize: "18px" }}>₹{order.total}</span>
                  </div>
                </div>
                <button style={styles.invoiceBtn} onClick={() => downloadInvoice(order)}>
                  📄 Download Invoice
                </button>
              </div>
            </div>
          );
        })
        )
      )}
    </div>
  );
}

const styles = {
  page: { maxWidth: "800px", margin: "0 auto", padding: "24px" },
  title: { color: "#232f3e" },
  orderCard: { background: "#fff", borderRadius: "12px", padding: "20px", marginBottom: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", border: "1px solid #f0f0f0" },
  orderHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", paddingBottom: "12px", borderBottom: "1px solid #f3f3f3" },
  orderId: { fontWeight: "bold", fontSize: "15px", color: "#232f3e", marginRight: "12px" },
  date: { color: "#888", fontSize: "13px" },
  statusBadge: { padding: "4px 12px", borderRadius: "12px", fontSize: "12px", fontWeight: "bold" },
  progressBar: { display: "flex", alignItems: "center", marginBottom: "16px", overflowX: "auto" },
  progressStep: { display: "flex", flexDirection: "column", alignItems: "center", position: "relative", flex: 1 },
  progressDot: { width: "28px", height: "28px", borderRadius: "50%", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "bold", marginBottom: "4px" },
  progressLabel: { fontSize: "10px", fontWeight: "bold", textAlign: "center" },
  progressLine: { position: "absolute", top: "14px", left: "60%", width: "80%", height: "2px" },
  shopBox: { background: "#fff8f0", border: "1px solid #ff9900", borderRadius: "10px", padding: "12px 16px", marginBottom: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  shopLeft: { display: "flex", alignItems: "center", gap: "12px" },
  shopIcon: { fontSize: "28px" },
  shopName: { margin: 0, fontWeight: "bold", fontSize: "15px", color: "#232f3e" },
  shopAddr: { margin: "4px 0 0", fontSize: "12px", color: "#888" },
  infoBox: { display: "flex", gap: "16px", background: "#f9f9f9", padding: "10px 14px", borderRadius: "8px", marginBottom: "10px", fontSize: "13px", color: "#555", flexWrap: "wrap" },
  deliveryBoyBox: { background: "#f3e5f5", padding: "8px 14px", borderRadius: "8px", marginBottom: "10px", fontSize: "13px", color: "#6a1b9a" },
  deliveryBoyStatus: { color: "#888", fontSize: "12px" },
  itemsSection: { display: "flex", flexDirection: "column", gap: "10px", marginBottom: "12px" },
  productCard: { display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f9f9f9", borderRadius: "8px", padding: "12px 16px", border: "1px solid #eee" },
  productLeft: { display: "flex", alignItems: "center", gap: "12px" },
  productIcon: { fontSize: "28px" },
  productName: { margin: 0, fontWeight: "bold", fontSize: "14px", color: "#232f3e" },
  shopNameSmall: { margin: "2px 0 0", fontSize: "12px", color: "#888" },
  shopAddrSmall: { margin: "2px 0 0", fontSize: "11px", color: "#aaa" },
  productRight: { textAlign: "right" },
  productQty: { margin: 0, fontSize: "13px", color: "#888" },
  productPrice: { margin: "2px 0", fontSize: "13px", color: "#555" },
  productTotal: { margin: 0, fontWeight: "bold", fontSize: "15px", color: "#232f3e" },
  mapBox: {},
  mapHeader: {}, mapLabel: {}, mapAddresses: {}, mapFrom: {}, mapArrow: {}, mapTo: {}, mapDot: {}, mapFrame: {}, mapLink: {},
  orderFooter: { paddingTop: "12px", borderTop: "1px solid #f3f3f3" },
  billBox: { background: "#f9f9f9", borderRadius: "10px", padding: "14px 16px" },
  billRow: { display: "flex", justifyContent: "space-between", fontSize: "14px", padding: "5px 0", color: "#555", borderBottom: "1px solid #eee" },
  billTotal: { display: "flex", justifyContent: "space-between", fontSize: "15px", fontWeight: "bold", paddingTop: "10px", marginTop: "4px", color: "#232f3e" },
  couponTag: { background: "#fff3e0", color: "#e65100", padding: "1px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: "bold", marginLeft: "6px" },
  grandTotal: { fontWeight: "bold", fontSize: "18px", color: "#ff9900" },
  cancelSection: { marginBottom: "12px", padding: "12px", background: "#fff5f5", borderRadius: "8px", border: "1px solid #ffcdd2" },
  penaltyWarning: { color: "#e65100", fontSize: "12px", margin: "0 0 8px", fontWeight: "bold" },
  cancelBtn: { background: "#e74c3c", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "13px" },
  cancelledBox: { background: "#ffebee", border: "1px solid #ffcdd2", borderRadius: "8px", padding: "12px", marginBottom: "12px" },
  cancelledText: { color: "#c62828", fontWeight: "bold", margin: "0 0 4px", fontSize: "14px" },
  penaltyText: { color: "#e65100", fontSize: "12px", margin: 0 },
  timelineBox: { background: "#f9f9f9", borderRadius: "10px", padding: "16px", marginBottom: "12px", border: "1px solid #eee" },
  timelineTitle: { fontWeight: "bold", fontSize: "14px", color: "#232f3e", margin: "0 0 12px" },
  timelineItem: { display: "flex", gap: "12px", position: "relative", paddingBottom: "12px" },
  timelineDot: { width: "12px", height: "12px", borderRadius: "50%", background: "#ff9900", flexShrink: 0, marginTop: "3px" },
  timelineLine: { position: "absolute", left: "5px", top: "15px", width: "2px", height: "100%", background: "#ddd" },
  timelineContent: { display: "flex", flexDirection: "column", gap: "2px" },
  timelineStatus: { fontWeight: "bold", fontSize: "13px", color: "#232f3e" },
  timelineNote: { fontSize: "12px", color: "#555" },
  timelineTime: { fontSize: "11px", color: "#aaa" },
  invoiceBtn: { background: "linear-gradient(135deg, #232f3e, #37475a)", color: "#ff9900", border: "none", padding: "10px 20px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", fontSize: "13px", marginTop: "12px", width: "100%" },
  tabs: { display: "flex", gap: "10px", marginBottom: "20px" },
  tab: { padding: "10px 20px", border: "1px solid #ff9900", borderRadius: "20px", cursor: "pointer", fontWeight: "bold", fontSize: "13px", display: "flex", alignItems: "center", gap: "8px" },
  tabCount: { background: "rgba(0,0,0,0.15)", borderRadius: "10px", padding: "1px 8px", fontSize: "12px" },
  empty: { textAlign: "center", padding: "60px", color: "#888" },
  otpBox: { background: "#fff8e1", border: "2px solid #ff9900", borderRadius: "10px", padding: "14px 16px", marginBottom: "10px" },
  otpCode: { fontSize: "28px", fontWeight: "bold", letterSpacing: "8px", color: "#232f3e", background: "#fff", border: "2px dashed #ff9900", borderRadius: "8px", padding: "8px 20px" },
  otpSendBtn: { background: "#ff9900", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "14px" },
};
