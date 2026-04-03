import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useToast } from "../context/ToastContext";
import { Trash2, Minus, Plus, ChevronRight, MapPin, Tag, Bike } from "lucide-react";
import { safeFetch } from "../utils/safeFetch";

const DELIVERY_CHARGE = 40;
const FREE_DELIVERY_ABOVE = 500;

export default function Cart() {
  const { cart, removeFromCart, updateQty, clearCart, total } = useCart();
  const { user, updateUser } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [address, setAddress] = useState(user?.address || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [couponMsg, setCouponMsg] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [penalty, setPenalty] = useState(0);
  const [nearestShopkeeper, setNearestShopkeeper] = useState(null);
  const [nearbyDeliveryBoys, setNearbyDeliveryBoys] = useState([]);
  const [locating, setLocating] = useState(false);
  const [notes, setNotes] = useState("");
  const [msg, setMsg] = useState("");

  const deliveryCharge = total >= FREE_DELIVERY_ABOVE ? 0 : DELIVERY_CHARGE;
  const finalTotal = total + deliveryCharge - discount + penalty;

  useEffect(() => {
    if (user?.id) {
      safeFetch(`/api/orders/penalty/${user.id}`).then(r => r.json()).then(d => setPenalty(d.penalty || 0));
    }
  }, [user]);

  useEffect(() => {
    if (!address.trim()) return;
    const parts = address.split(",").map(p => p.trim());
    const city = parts[parts.length - 2] || parts[parts.length - 1];
    if (!city) return;
    safeFetch(`/api/auth/nearest-shopkeeper/${city}`).then(r => r.json()).then(setNearestShopkeeper);
    safeFetch(`/api/auth/nearby-delivery-boys/${city}`).then(r => r.json()).then(setNearbyDeliveryBoys);
  }, [address]);

  const detectLocation = () => {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
      const data = await res.json();
      setAddress(data.display_name || `${latitude}, ${longitude}`);
      setLocating(false);
    }, () => { setMsg("Could not detect location"); setLocating(false); });
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) return setCouponMsg("Enter a coupon code");
    const res = await fetch("/api/coupons/apply", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: couponCode, orderTotal: total }),
    });
    const data = await res.json();
    if (!res.ok) return setCouponMsg(data.message);
    setDiscount(data.discount); setCouponApplied(true); setCouponMsg(data.message);
  };

  const handlePlaceOrder = async () => {
    if (paymentMethod === "upi" || paymentMethod === "card") {
      try {
        const rpRes = await safeFetch("/api/payment/create-order", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: finalTotal }),
        });
        const rpData = await rpRes.json();
        if (!rpRes.ok) return setMsg(rpData.message);
        const options = {
          key: rpData.key, amount: rpData.amount, currency: rpData.currency,
          name: "Apni Dukann", description: "Order Payment", order_id: rpData.orderId,
          prefill: { name: user.name, email: user.email, contact: phone },
          theme: { color: "#00C853" },
          handler: async (response) => {
            const verifyRes = await safeFetch("/api/payment/verify", {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify(response),
            });
            const verifyData = await verifyRes.json();
            if (verifyData.verified) await placeOrder(verifyData.paymentId);
            else setMsg("Payment verification failed.");
          },
          modal: { ondismiss: () => setMsg("Payment cancelled.") },
        };
        new window.Razorpay(options).open();
      } catch { setMsg("Payment failed."); }
    } else {
      await placeOrder();
    }
  };

  const placeOrder = async (paymentId = "") => {
    const res = await fetch("/api/orders", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerId: user.id, customerName: user.name, customerEmail: user.email,
        deliveryAddress: address, phone, paymentMethod, deliveryCharge, discount,
        couponCode, penaltyCharge: penalty, notes,
        items: cart.map(i => ({ productId: i._id || i.id, name: i.name, price: Number(i.price), quantity: i.quantity })),
      }),
    });
    const data = await res.json();
    if (res.ok) {
      await safeFetch(`/api/auth/update-profile/${user.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, phone }),
      });
      updateUser({ address, phone });
      clearCart();
      if (penalty > 0) { await safeFetch(`/api/orders/penalty/${user.id}/clear`, { method: "PUT" }); }
      addToast("🎉 Order placed! Shopkeeper notified.", "success", 5000);
      setStep(4);
    } else setMsg(data.message);
  };

  if (cart.length === 0 && step !== 4) return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "20px", padding: "32px", background: "var(--surface)" }}>
      <p style={{ fontSize: "64px" }}>🛒</p>
      <h2 style={{ fontSize: "22px", fontWeight: "900", color: "var(--on-surface)", fontFamily: "var(--font-display)" }}>Your cart is empty</h2>
      <p style={{ color: "#747776", fontSize: "14px", textAlign: "center", fontFamily: "var(--font-body)" }}>Add some products to get started</p>
      <button onClick={() => navigate("/")} style={{ background: "var(--primary)", color: "var(--on-primary)", fontWeight: "bold", padding: "14px 36px", borderRadius: "var(--radius-full)", border: "none", cursor: "pointer", fontFamily: "var(--font-display)", fontSize: "16px", boxShadow: "0 8px 20px rgba(0,106,40,0.2)" }}>
        Start Shopping
      </button>
    </div>
  );

  if (step === 4) return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "20px", padding: "32px", background: "var(--surface)" }}>
      <div style={{ width: "80px", height: "80px", background: "var(--primary-container)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "8px" }}>
        <span style={{ fontSize: "40px" }}>✅</span>
      </div>
      <h2 style={{ fontSize: "26px", fontWeight: "900", color: "var(--on-surface)", fontFamily: "var(--font-display)" }}>Order Placed!</h2>
      <p style={{ color: "#747776", fontSize: "14px", textAlign: "center", fontFamily: "var(--font-body)" }}>Your order has been confirmed. Shopkeeper has been notified.</p>
      <div style={{ background: "var(--surface-lowest)", borderRadius: "var(--radius-md)", padding: "24px", width: "100%", maxWidth: "380px", boxShadow: "var(--shadow-ambient)" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "14px", fontFamily: "var(--font-body)" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#747776" }}>Address</span><span style={{ fontWeight: "600", color: "var(--on-surface)", textAlign: "right", maxWidth: "200px" }}>{address}</span></div>
          <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#747776" }}>Payment</span><span style={{ fontWeight: "600" }}>{paymentMethod === "cod" ? "💵 COD" : paymentMethod === "upi" ? "📱 UPI" : "💳 Card"}</span></div>
          {nearestShopkeeper && <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#747776" }}>Shopkeeper</span><span style={{ fontWeight: "600", color: "var(--primary)" }}>{nearestShopkeeper.name}</span></div>}
          <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--surface-low)", paddingTop: "12px", marginTop: "4px" }}><span style={{ fontWeight: "900", color: "var(--on-surface)" }}>Total</span><span style={{ fontWeight: "900", color: "var(--primary)", fontSize: "18px" }}>₹{finalTotal}</span></div>
        </div>
      </div>
      <button onClick={() => navigate("/orders")} style={{ background: "var(--primary)", color: "var(--on-primary)", fontWeight: "bold", padding: "16px 36px", borderRadius: "var(--radius-full)", border: "none", cursor: "pointer", width: "100%", maxWidth: "380px", fontFamily: "var(--font-display)", fontSize: "16px", boxShadow: "0 8px 20px rgba(0,106,40,0.2)" }}>
        Track My Order →
      </button>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "var(--surface)", paddingBottom: "120px" }}>
      {/* Header */}
      <div style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(20px)", padding: "16px 24px", display: "flex", alignItems: "center", gap: "14px", position: "sticky", top: 0, zIndex: 10, boxShadow: "0 2px 16px rgba(0,0,0,0.04)" }}>
        <button onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)} style={{ width: "40px", height: "40px", background: "var(--surface-low)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", border: "none", cursor: "pointer", fontSize: "18px" }}>
          ←
        </button>
        <h1 style={{ fontSize: "20px", fontWeight: "900", color: "var(--on-surface)", fontFamily: "var(--font-display)" }}>
          {step === 1 ? "My Cart" : step === 2 ? "Delivery Details" : "Payment"}
        </h1>
        {/* Step indicator */}
        <div style={{ marginLeft: "auto", display: "flex", gap: "6px" }}>
          {[1,2,3].map(s => (
            <div key={s} style={{ height: "6px", borderRadius: "3px", transition: "all 0.3s", width: s <= step ? "24px" : "10px", background: s <= step ? "var(--primary)" : "var(--surface-low)" }} />
          ))}
        </div>
      </div>

      {msg && <div style={{ margin: "12px 16px 0", background: "#fff0ed", color: "#b02500", fontSize: "14px", fontWeight: "600", padding: "12px 16px", borderRadius: "var(--radius-md)", fontFamily: "var(--font-body)" }}>{msg}</div>}

      {/* Step 1 - Cart */}
      {step === 1 && (
        <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
          {cart.map((item) => (
            <div key={item._id || item.id} style={{ background: "var(--surface-lowest)", borderRadius: "var(--radius-md)", padding: "16px", display: "flex", gap: "12px", boxShadow: "var(--shadow-ambient)" }}>
              <img src={item.image || "https://placehold.co/80x80?text=No"} alt={item.name}
                style={{ width: "80px", height: "80px", borderRadius: "var(--radius-sm)", objectFit: "cover", flexShrink: 0 }}
                onError={(e) => { e.target.src = "https://placehold.co/80x80?text=No"; }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: "12px", color: "#747776", fontFamily: "var(--font-body)" }}>🏪 {item.shopkeeperName}</p>
                <h3 style={{ fontSize: "15px", fontWeight: "700", color: "var(--on-surface)", fontFamily: "var(--font-display)", marginTop: "4px", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{item.name}</h3>
                <p style={{ fontSize: "18px", fontWeight: "800", color: "var(--primary)", marginTop: "4px", fontFamily: "var(--font-display)" }}>₹{item.price}</p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", justifyContent: "space-between" }}>
                <button onClick={() => removeFromCart(item._id || item.id)} style={{ width: "32px", height: "32px", background: "#fff0ed", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", border: "none", cursor: "pointer" }}>
                  <Trash2 size={13} style={{ color: "#b02500" }} />
                </button>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "var(--surface-low)", borderRadius: "var(--radius-full)", padding: "8px 14px" }}>
                  <button onClick={() => updateQty(item._id || item.id, item.quantity - 1)} style={{ border: "none", background: "none", cursor: "pointer" }}>
                    <Minus size={14} style={{ color: "#595c5b" }} />
                  </button>
                  <span style={{ fontSize: "15px", fontWeight: "900", color: "var(--on-surface)", minWidth: "20px", textAlign: "center" }}>{item.quantity}</span>
                  <button onClick={() => updateQty(item._id || item.id, item.quantity + 1)} style={{ border: "none", background: "none", cursor: "pointer" }}>
                    <Plus size={14} style={{ color: "var(--primary)" }} />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Order Notes */}
          <div style={{ background: "var(--surface-lowest)", borderRadius: "var(--radius-md)", padding: "16px", boxShadow: "var(--shadow-ambient)" }}>
            <p style={{ fontSize: "14px", fontWeight: "700", color: "var(--on-surface)", marginBottom: "10px", fontFamily: "var(--font-display)" }}>📝 Order Instructions</p>
            <textarea style={{ width: "100%", background: "var(--surface-low)", borderRadius: "var(--radius-sm)", padding: "12px", fontSize: "14px", outline: "none", resize: "none", color: "var(--on-surface)", border: "none", fontFamily: "var(--font-body)", boxSizing: "border-box" }}
              rows={3} placeholder="Any special instructions for your order..."
              value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          {/* Coupon */}
          <div style={{ background: "var(--surface-lowest)", borderRadius: "var(--radius-md)", padding: "16px", boxShadow: "var(--shadow-ambient)" }}>
            <p style={{ fontSize: "14px", fontWeight: "700", color: "var(--on-surface)", marginBottom: "10px", display: "flex", alignItems: "center", gap: "8px", fontFamily: "var(--font-display)" }}>
              <Tag size={14} style={{ color: "var(--primary)" }} /> Have a Coupon?
            </p>
            {!couponApplied ? (
              <div style={{ display: "flex", gap: "10px" }}>
                <input style={{ flex: 1, background: "var(--surface-low)", borderRadius: "var(--radius-full)", padding: "12px 18px", fontSize: "14px", fontWeight: "700", outline: "none", letterSpacing: "4px", textTransform: "uppercase", border: "none", fontFamily: "var(--font-body)" }}
                  placeholder="ENTER CODE" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} />
                <button onClick={applyCoupon} style={{ background: "var(--primary)", color: "var(--on-primary)", fontSize: "14px", fontWeight: "700", padding: "12px 20px", borderRadius: "var(--radius-full)", border: "none", cursor: "pointer", fontFamily: "var(--font-display)" }}>Apply</button>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#e8f5e9", borderRadius: "var(--radius-full)", padding: "12px 18px" }}>
                <span style={{ fontSize: "14px", fontWeight: "700", color: "var(--primary)" }}>✅ {couponCode} — Saved ₹{discount}</span>
                <button onClick={() => { setDiscount(0); setCouponApplied(false); setCouponCode(""); setCouponMsg(""); }} style={{ background: "none", border: "none", color: "#b02500", fontSize: "13px", fontWeight: "700", cursor: "pointer" }}>Remove</button>
              </div>
            )}
            {couponMsg && <p style={{ fontSize: "12px", marginTop: "6px", fontWeight: "600", color: couponApplied ? "var(--primary)" : "#b02500" }}>{couponMsg}</p>}
          </div>

          {/* Order Summary */}
          <div style={{ background: "var(--surface-lowest)", borderRadius: "var(--radius-md)", padding: "16px", boxShadow: "var(--shadow-ambient)" }}>
            <p style={{ fontSize: "15px", fontWeight: "900", color: "var(--on-surface)", marginBottom: "14px", fontFamily: "var(--font-display)" }}>Order Summary</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "14px", fontFamily: "var(--font-body)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", color: "#595c5b" }}><span>Subtotal</span><span>₹{total}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", color: "#595c5b" }}>
                <span>🚚 Delivery</span>
                <span style={{ color: deliveryCharge === 0 ? "var(--primary)" : "inherit", fontWeight: deliveryCharge === 0 ? "700" : "normal" }}>{deliveryCharge === 0 ? "FREE 🎉" : `₹${deliveryCharge}`}</span>
              </div>
              {discount > 0 && <div style={{ display: "flex", justifyContent: "space-between", color: "var(--primary)" }}><span>🎟️ Discount</span><span>-₹{discount}</span></div>}
              {penalty > 0 && <div style={{ display: "flex", justifyContent: "space-between", color: "#b02500" }}><span>⚠️ Penalty</span><span>₹{penalty}</span></div>}
              {total < FREE_DELIVERY_ABOVE && (
                <p style={{ fontSize: "12px", color: "var(--secondary)", fontWeight: "600", background: "var(--secondary-container)", borderRadius: "var(--radius-full)", padding: "8px 16px", textAlign: "center" }}>
                  Add ₹{FREE_DELIVERY_ABOVE - total} more for FREE delivery!
                </p>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "900", color: "var(--on-surface)", fontSize: "16px", borderTop: "1px solid var(--surface-low)", paddingTop: "12px", marginTop: "4px" }}>
                <span>Total</span><span style={{ color: "var(--primary)" }}>₹{finalTotal}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 2 - Delivery */}
      {step === 2 && (
        <div className="px-4 pt-4 space-y-3">
          <button onClick={detectLocation} disabled={locating}
            className="w-full bg-gray-900 text-white font-bold py-3 rounded-full flex items-center justify-center gap-2 active:scale-95 transition-all">
            <MapPin size={16} className="text-primary" />
            {locating ? "Detecting..." : "📍 Auto Detect My Location"}
          </button>

          {user?.address && (
            <div className="bg-green-50 border border-primary rounded-2xl px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-xs text-primary font-bold">✅ Saved Address</p>
                <p className="text-xs text-gray-600 mt-0.5 line-clamp-1">{user.address}</p>
              </div>
              <button onClick={() => { setAddress(""); setPhone(""); }} className="text-xs text-gray-400 font-bold">Change</button>
            </div>
          )}

          <div className="bg-white rounded-3xl p-4 shadow-sm space-y-3">
            <input className="w-full bg-gray-50 rounded-full px-4 py-3 text-sm font-medium outline-none"
              placeholder="📱 Phone Number" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <textarea className="w-full bg-gray-50 rounded-2xl px-4 py-3 text-sm font-medium outline-none resize-none"
              rows={3} placeholder="🏠 Full Address (House No, Street, Area, City, Pincode)"
              value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>

          {nearestShopkeeper && (
            <div className="bg-white rounded-3xl p-4 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-xl">🏪</div>
              <div>
                <p className="text-xs text-primary font-bold">Nearest Shopkeeper</p>
                <p className="text-sm font-black text-gray-900">{nearestShopkeeper.name}</p>
                <p className="text-xs text-gray-400">{nearestShopkeeper.address}</p>
              </div>
            </div>
          )}

          {nearbyDeliveryBoys.length > 0 && (
            <div className="bg-white rounded-3xl p-4 shadow-sm">
              <p className="text-xs font-bold text-purple-600 mb-2 flex items-center gap-1">
                <Bike size={14} /> {nearbyDeliveryBoys.length} Delivery Boy{nearbyDeliveryBoys.length > 1 ? "s" : ""} Available
              </p>
              <div className="flex gap-2 flex-wrap">
                {nearbyDeliveryBoys.map(db => (
                  <span key={db._id} className="bg-purple-50 text-purple-600 text-xs font-bold px-3 py-1 rounded-full">
                    🛵 {db.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 3 - Payment */}
      {step === 3 && (
        <div className="px-4 pt-4 space-y-3">
          {[
            { value: "cod", icon: "💵", label: "Cash on Delivery", desc: "Pay when order arrives", badge: null },
            { value: "upi", icon: "📱", label: "UPI Payment", desc: "GPay, PhonePe, Paytm", badge: "Instant" },
            { value: "card", icon: "💳", label: "Credit / Debit Card", desc: "Visa, Mastercard, RuPay", badge: "Secure" },
          ].map((opt) => (
            <button key={opt.value} onClick={() => setPaymentMethod(opt.value)}
              className={`w-full bg-white rounded-3xl p-4 shadow-sm flex items-center gap-4 transition-all active:scale-95 border-2 ${paymentMethod === opt.value ? "border-primary" : "border-transparent"}`}>
              <span className="text-3xl">{opt.icon}</span>
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-black text-gray-900">{opt.label}</p>
                  {opt.badge && <span className="bg-green-100 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full">{opt.badge}</span>}
                </div>
                <p className="text-xs text-gray-400">{opt.desc}</p>
                {opt.value !== "cod" && paymentMethod === opt.value && (
                  <p className="text-[10px] text-blue-500 font-bold mt-0.5">🔒 Secured by Razorpay</p>
                )}
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === opt.value ? "border-primary" : "border-gray-300"}`}>
                {paymentMethod === opt.value && <div className="w-2.5 h-2.5 bg-primary rounded-full" />}
              </div>
            </button>
          ))}

          {/* Final Summary */}
          <div className="bg-white rounded-3xl p-4 shadow-sm">
            <p className="text-sm font-black text-gray-900 mb-3">Final Summary</p>
            <div className="space-y-2 text-sm">
              {cart.map(item => (
                <div key={item._id || item.id} className="flex justify-between text-gray-500">
                  <span className="line-clamp-1 flex-1">{item.name} ×{item.quantity}</span>
                  <span className="ml-2">₹{item.price * item.quantity}</span>
                </div>
              ))}
              <div className="flex justify-between text-gray-500"><span>🚚 Delivery</span><span className={deliveryCharge === 0 ? "text-primary font-bold" : ""}>{deliveryCharge === 0 ? "FREE" : `₹${deliveryCharge}`}</span></div>
              {discount > 0 && <div className="flex justify-between text-primary"><span>🎟️ Coupon</span><span>-₹{discount}</span></div>}
              <div className="flex justify-between font-black text-gray-900 text-base border-t pt-2">
                <span>Grand Total</span><span className="text-primary">₹{finalTotal}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sticky CTA */}
      <div style={{ position: "fixed", bottom: 0, left: 0, width: "100%", background: "rgba(255,255,255,0.95)", backdropFilter: "blur(20px)", padding: "16px 24px", zIndex: 50, boxShadow: "0 -4px 24px rgba(0,0,0,0.06)" }}>
        {step === 1 && (
          <button onClick={() => { if (!user) return navigate("/login"); setStep(2); }}
            style={{ width: "100%", background: "var(--primary)", color: "var(--on-primary)", fontWeight: "900", padding: "18px 24px", borderRadius: "var(--radius-full)", display: "flex", alignItems: "center", justifyContent: "space-between", border: "none", cursor: "pointer", fontFamily: "var(--font-display)", fontSize: "16px", boxShadow: "0 8px 20px rgba(0,106,40,0.2)" }}>
            <span>Proceed to Delivery</span>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ fontWeight: "900" }}>₹{finalTotal}</span>
              <ChevronRight size={18} />
            </div>
          </button>
        )}
        {step === 2 && (
          <button onClick={() => {
            if (!phone.trim() || !address.trim()) return setMsg("Please fill phone and address.");
            setMsg(""); setStep(3);
          }} style={{ width: "100%", background: "var(--primary)", color: "var(--on-primary)", fontWeight: "900", padding: "18px 24px", borderRadius: "var(--radius-full)", display: "flex", alignItems: "center", justifyContent: "space-between", border: "none", cursor: "pointer", fontFamily: "var(--font-display)", fontSize: "16px", boxShadow: "0 8px 20px rgba(0,106,40,0.2)" }}>
            <span>Continue to Payment</span>
            <ChevronRight size={18} />
          </button>
        )}
        {step === 3 && (
          <button onClick={handlePlaceOrder}
            style={{ width: "100%", background: "var(--primary)", color: "var(--on-primary)", fontWeight: "900", padding: "18px 24px", borderRadius: "var(--radius-full)", display: "flex", alignItems: "center", justifyContent: "space-between", border: "none", cursor: "pointer", fontFamily: "var(--font-display)", fontSize: "16px", boxShadow: "0 8px 20px rgba(0,106,40,0.2)" }}>
            <span>Place Order</span>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span>₹{finalTotal}</span>
              <ChevronRight size={18} />
            </div>
          </button>
        )}
      </div>
    </div>
  );
}
