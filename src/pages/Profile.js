import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { validatePhone, validateName, validateRequired } from "../utils/validation";

export default function Profile() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", address: "", location: "" });
  const [msg, setMsg] = useState("");
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (!user) return navigate("/login");
    setForm({ name: user.name || "", phone: user.phone || "", address: user.address || "", location: user.location || "" });
    if (user.role === "customer") {
      fetch(`/api/orders/customer/${user.id}`).then((r) => r.json()).then(setOrders);
    }
  }, [user, navigate]);

  const handleSave = async () => {
    const e = {};
    const nameErr = validateName(form.name);
    const phoneErr = form.phone ? validatePhone(form.phone) : "";
    const cityErr = validateRequired(form.location, "City");
    if (nameErr) e.name = nameErr;
    if (phoneErr) e.phone = phoneErr;
    if (cityErr) e.location = cityErr;
    setFormErrors(e);
    if (Object.keys(e).length > 0) return;
    const res = await fetch(`/api/auth/update-profile/${user.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      updateUser(form);
      setEditing(false);
      setMsg("✅ Profile updated!");
      setTimeout(() => setMsg(""), 2000);
    }
  };

  if (!user) return null;

  const totalSpent = orders.reduce((sum, o) => sum + o.total, 0);

  const roleColor = user.role === "shopkeeper" ? "#1565c0" : user.role === "deliveryBoy" ? "#27ae60" : "#e65100";
  const roleBg = user.role === "shopkeeper" ? "#e3f2fd" : user.role === "deliveryBoy" ? "#e8f5e9" : "#fff3e0";
  const roleLabel = user.role === "shopkeeper" ? "🏪 Shopkeeper" : user.role === "deliveryBoy" ? "🛵 Delivery Boy" : "🛍️ Customer";
  const avatarBg = user.role === "shopkeeper" ? "linear-gradient(135deg, #1565c0, #1976d2)" : user.role === "deliveryBoy" ? "linear-gradient(135deg, #27ae60, #2ecc71)" : "linear-gradient(135deg, #ff9900, #e67e00)";

  return (
    <div style={styles.page}>
      <div style={styles.card}>

        {/* Avatar */}
        <div style={{ ...styles.avatar, background: avatarBg }}>{user.name[0].toUpperCase()}</div>

        {!editing ? (
          <>
            <h2 style={styles.name}>{user.name}</h2>
            <span style={{ ...styles.roleBadge, background: roleBg, color: roleColor }}>{roleLabel}</span>

            {/* Info */}
            <div style={styles.infoBox}>
              <div style={styles.infoRow}><span style={styles.label}>📧 Email</span><span>{user.email}</span></div>
              {user.phone && <div style={styles.infoRow}><span style={styles.label}>📱 Phone</span><span>{user.phone}</span></div>}
              {user.address && <div style={styles.infoRow}><span style={styles.label}>📍 Address</span><span style={styles.addrText}>{user.address}</span></div>}
              {user.location && <div style={styles.infoRow}><span style={styles.label}>🏙️ City</span><span>{user.location}</span></div>}
              <div style={styles.infoRow}><span style={styles.label}>👤 Role</span><span style={{ textTransform: "capitalize" }}>{user.role === "deliveryBoy" ? "Delivery Boy" : user.role}</span></div>
            </div>

            {msg && <p style={styles.successMsg}>{msg}</p>}

            {/* Stats */}
            {user.role === "customer" && (
              <div style={styles.stats}>
                <div style={styles.statBox}><span style={styles.statNum}>{orders.length}</span><span style={styles.statLabel}>Orders</span></div>
                <div style={styles.statBox}><span style={styles.statNum}>₹{totalSpent}</span><span style={styles.statLabel}>Total Spent</span></div>
              </div>
            )}

            {/* Actions */}
            <div style={styles.actions}>
              <button style={styles.editBtn} onClick={() => setEditing(true)}>✏️ Edit Profile</button>

              {user.role === "customer" && (
                <button style={styles.btn} onClick={() => navigate("/orders")}>📦 My Orders</button>
              )}
              {user.role === "shopkeeper" && (
                <>
                  <button style={styles.btn} onClick={() => navigate("/shopkeeper/dashboard")}>🏪 Dashboard</button>
                  <button style={styles.btn} onClick={() => navigate("/shopkeeper/notifications")}>🔔 Notifications</button>
                </>
              )}
              {user.role === "deliveryBoy" && (
                <button style={styles.btn} onClick={() => navigate("/delivery/dashboard")}>🛵 Delivery Dashboard</button>
              )}
              <button style={{ ...styles.btn, background: "#e74c3c" }} onClick={() => { logout(); navigate("/login"); }}>🚪 Logout</button>
            </div>
          </>
        ) : (
          <>
            <h2 style={styles.name}>✏️ Edit Profile</h2>
            <div style={styles.editForm}>
              <label style={styles.editLabel}>Full Name</label>
              <input style={{ ...styles.input, borderColor: formErrors.name ? "#e74c3c" : "#ddd" }} value={form.name} onChange={(e) => { setForm({ ...form, name: e.target.value }); setFormErrors({ ...formErrors, name: "" }); }} placeholder="Full Name" />
              {formErrors.name && <p style={styles.fieldError}>⚠️ {formErrors.name}</p>}

              <label style={styles.editLabel}>📱 Phone Number</label>
              <input style={{ ...styles.input, borderColor: formErrors.phone ? "#e74c3c" : "#ddd" }} value={form.phone} onChange={(e) => { setForm({ ...form, phone: e.target.value.replace(/\D/g, "") }); setFormErrors({ ...formErrors, phone: "" }); }} placeholder="10-digit Mobile Number" type="tel" maxLength={10} />
              {formErrors.phone && <p style={styles.fieldError}>⚠️ {formErrors.phone}</p>}

              <label style={styles.editLabel}>📍 Address</label>
              <textarea style={{ ...styles.input, height: "80px", resize: "vertical" }} value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Full Address" />

              <label style={styles.editLabel}>🏙️ City</label>
              <input style={{ ...styles.input, borderColor: formErrors.location ? "#e74c3c" : "#ddd" }} value={form.location} onChange={(e) => { setForm({ ...form, location: e.target.value }); setFormErrors({ ...formErrors, location: "" }); }} placeholder="Your City (e.g. Pune, Mumbai)" />
              {formErrors.location && <p style={styles.fieldError}>⚠️ {formErrors.location}</p>}

              <div style={styles.editBtns}>
                <button style={styles.saveBtn} onClick={handleSave}>✅ Save Changes</button>
                <button style={styles.cancelBtn} onClick={() => setEditing(false)}>Cancel</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f3f3f3", padding: "24px" },
  card: { background: "#fff", padding: "40px", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", textAlign: "center", width: "400px" },
  avatar: { width: "90px", height: "90px", borderRadius: "50%", color: "#fff", fontSize: "40px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontWeight: "bold" },
  name: { margin: "0 0 8px", color: "#232f3e", fontSize: "22px" },
  roleBadge: { padding: "4px 16px", borderRadius: "20px", fontSize: "13px", fontWeight: "bold" },
  infoBox: { background: "#f9f9f9", borderRadius: "10px", padding: "16px", margin: "20px 0", textAlign: "left" },
  infoRow: { display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #eee", fontSize: "14px", gap: "12px" },
  label: { color: "#888", fontWeight: "bold", whiteSpace: "nowrap" },
  addrText: { fontSize: "12px", color: "#555", textAlign: "right" },
  successMsg: { color: "#27ae60", fontWeight: "bold", fontSize: "14px", margin: "-10px 0 10px" },
  stats: { display: "flex", gap: "16px", justifyContent: "center", margin: "0 0 20px" },
  statBox: { background: "#fff3e0", borderRadius: "10px", padding: "14px 24px", display: "flex", flexDirection: "column", alignItems: "center" },
  statNum: { fontSize: "22px", fontWeight: "bold", color: "#ff9900" },
  statLabel: { fontSize: "12px", color: "#888", marginTop: "4px" },
  actions: { display: "flex", flexDirection: "column", gap: "10px" },
  btn: { background: "#ff9900", border: "none", padding: "12px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "14px" },
  editBtn: { background: "#232f3e", color: "#ff9900", border: "none", padding: "12px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "14px" },
  editForm: { textAlign: "left", marginTop: "16px" },
  editLabel: { fontSize: "13px", fontWeight: "bold", color: "#555", display: "block", marginBottom: "4px" },
  input: { width: "100%", padding: "10px", marginBottom: "14px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" },
  editBtns: { display: "flex", gap: "10px" },
  saveBtn: { flex: 1, background: "#27ae60", color: "#fff", border: "none", padding: "12px", borderRadius: "6px", fontWeight: "bold", cursor: "pointer" },
  cancelBtn: { flex: 1, background: "#f3f3f3", border: "1px solid #ddd", padding: "12px", borderRadius: "6px", fontWeight: "bold", cursor: "pointer" },
  fieldError: { color: "#e74c3c", fontSize: "12px", margin: "-10px 0 8px", paddingLeft: "2px" },
};
