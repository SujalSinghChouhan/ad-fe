import { useEffect, useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const emptyForm = { name: "", price: "", description: "", image: "", category: "", stock: "100" };

export default function ShopkeeperDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [msg, setMsg] = useState("");
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!user || user.role !== "shopkeeper") return navigate("/login");
    fetchProducts();
  }, [user, navigate]);

  const fetchProducts = () => {
    fetch(`/api/products/shopkeeper/${user.id}`)
      .then((r) => r.json())
      .then(setProducts);
  };

  // Handle image file selection and upload
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Show preview immediately
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result);
    reader.readAsDataURL(file);

    // Upload to server
    setUploading(true);
    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok) {
        setForm((prev) => ({ ...prev, image: data.imageUrl }));
        setMsg("✅ Image uploaded!");
        setTimeout(() => setMsg(""), 2000);
      } else {
        setMsg("❌ " + data.message);
      }
    } catch {
      setMsg("❌ Upload failed. Check backend.");
    }
    setUploading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = editId ? `/api/products/${editId}` : "/api/products";
    const method = editId ? "PUT" : "POST";
    const res = await fetch(url, {
      method, headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, price: Number(form.price), stock: Number(form.stock), shopkeeperId: user.id, shopkeeperName: user.name }),
    });
    if (res.ok) {
      setMsg(editId ? "✅ Product updated!" : "✅ Product added!");
      setForm(emptyForm); setEditId(null); setPreview("");
      fetchProducts();
      setTimeout(() => setMsg(""), 2000);
    }
  };

  const handleEdit = (p) => {
    setForm({ name: p.name, price: p.price, description: p.description, image: p.image || "", category: p.category, stock: p.stock ?? 100 });
    setPreview(p.image || "");
    setEditId(p._id || p.id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    await fetch(`/api/products/${id}`, { method: "DELETE" });
    fetchProducts();
  };

  return (
    <div style={styles.page}>
      <h2 style={styles.title}>🏪 Shopkeeper Dashboard</h2>
      <div style={styles.layout}>

        {/* Add/Edit Form */}
        <div style={styles.formBox}>
          <h3 style={{ margin: "0 0 16px", color: "#232f3e" }}>{editId ? "✏️ Edit Product" : "➕ Add New Product"}</h3>
          {msg && <p style={{ ...styles.msg, background: msg.startsWith("❌") ? "#ffebee" : "#e8f5e9", color: msg.startsWith("❌") ? "#c62828" : "#2e7d32" }}>{msg}</p>}

          <form onSubmit={handleSubmit}>
            <input style={styles.input} placeholder="Product Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <input style={styles.input} placeholder="Price (₹)" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
            <input style={styles.input} placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required />
            <input style={styles.input} placeholder="Stock Quantity" type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} required />
            <textarea style={{ ...styles.input, height: "80px", resize: "vertical" }} placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />

            {/* Image Upload Section */}
            <div style={styles.imageSection}>
              <p style={styles.imageLabel}>📸 Product Image</p>

              {/* Upload Button */}
              <div style={styles.uploadArea} onClick={() => fileInputRef.current?.click()}>
                {preview ? (
                  <img src={preview} alt="preview" style={styles.previewImg} />
                ) : (
                  <div style={styles.uploadPlaceholder}>
                    <span style={{ fontSize: "32px" }}>📷</span>
                    <p style={{ margin: "8px 0 0", fontSize: "13px", color: "#888" }}>Click to upload image</p>
                    <p style={{ margin: "4px 0 0", fontSize: "11px", color: "#aaa" }}>JPEG, PNG, WebP • Max 5MB</p>
                  </div>
                )}
                {uploading && (
                  <div style={styles.uploadOverlay}>
                    <span style={{ fontSize: "24px" }}>⏳</span>
                    <p style={{ margin: "4px 0 0", color: "#fff", fontSize: "13px" }}>Uploading...</p>
                  </div>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: "none" }} onChange={handleImageUpload} />

              {/* OR paste URL */}
              <p style={styles.orText}>— or paste image URL —</p>
              <input style={styles.input} placeholder="https://example.com/image.jpg" value={form.image}
                onChange={(e) => { setForm({ ...form, image: e.target.value }); setPreview(e.target.value); }} />

              {preview && (
                <button type="button" style={styles.clearImgBtn} onClick={() => { setPreview(""); setForm({ ...form, image: "" }); }}>
                  ✕ Remove Image
                </button>
              )}
            </div>

            <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
              <button style={styles.btn} type="submit" disabled={uploading}>
                {editId ? "Update Product" : "Add Product"}
              </button>
              {editId && (
                <button type="button" style={{ ...styles.btn, background: "#888" }} onClick={() => { setEditId(null); setForm(emptyForm); setPreview(""); }}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Products List */}
        <div style={styles.productList}>
          <h3 style={{ margin: "0 0 16px", color: "#232f3e" }}>Your Products ({products.length})</h3>
          {products.length === 0 ? (
            <div style={styles.emptyProducts}>
              <span style={{ fontSize: "48px" }}>📦</span>
              <p>No products yet. Add your first product!</p>
            </div>
          ) : (
            products.map((p) => (
              <div key={p._id || p.id} style={styles.productItem}>
                <img src={p.image || "https://placehold.co/60x50?text=No+Img"} alt={p.name} style={styles.pImg}
                  onError={(e) => { e.target.src = "https://placehold.co/60x50?text=No+Img"; }} />
                <div style={styles.pInfo}>
                  <strong style={{ fontSize: "14px" }}>{p.name}</strong>
                  <div style={{ display: "flex", gap: "6px", alignItems: "center", marginTop: "4px" }}>
                    <span style={styles.pCat}>{p.category}</span>
                    <span style={{ fontSize: "13px", color: "#ff9900", fontWeight: "bold" }}>₹{p.price}</span>
                  </div>
                  <span style={{ fontSize: "12px", color: p.stock === 0 ? "#e74c3c" : p.stock <= 5 ? "#e65100" : "#27ae60" }}>
                    {p.stock === 0 ? "❌ Out of Stock" : p.stock <= 5 ? `🔥 Only ${p.stock} left` : `✅ Stock: ${p.stock}`}
                  </span>
                </div>
                <div style={styles.pActions}>
                  <button style={styles.editBtn} onClick={() => handleEdit(p)}>✏️ Edit</button>
                  <button style={styles.delBtn} onClick={() => handleDelete(p._id || p.id)}>🗑️</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { padding: "24px", maxWidth: "1100px", margin: "0 auto" },
  title: { color: "#232f3e", marginBottom: "20px" },
  layout: { display: "flex", gap: "24px", flexWrap: "wrap" },
  formBox: { background: "#fff", padding: "24px", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", flex: "0 0 360px" },
  input: { width: "100%", padding: "10px 12px", marginBottom: "12px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box", outline: "none" },
  imageSection: { marginBottom: "12px" },
  imageLabel: { fontWeight: "bold", fontSize: "13px", color: "#555", margin: "0 0 8px" },
  uploadArea: { border: "2px dashed #ddd", borderRadius: "10px", cursor: "pointer", overflow: "hidden", position: "relative", minHeight: "140px", display: "flex", alignItems: "center", justifyContent: "center", background: "#fafafa", marginBottom: "8px" },
  uploadPlaceholder: { textAlign: "center", padding: "20px" },
  previewImg: { width: "100%", height: "160px", objectFit: "cover", display: "block" },
  uploadOverlay: { position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" },
  orText: { textAlign: "center", color: "#aaa", fontSize: "12px", margin: "8px 0" },
  clearImgBtn: { background: "#ffebee", color: "#e74c3c", border: "1px solid #ffcdd2", padding: "6px 14px", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "bold", marginBottom: "8px" },
  btn: { background: "#ff9900", border: "none", padding: "11px 20px", borderRadius: "6px", fontWeight: "bold", cursor: "pointer", fontSize: "14px" },
  msg: { padding: "8px 12px", borderRadius: "6px", marginBottom: "12px", fontSize: "13px", fontWeight: "bold" },
  productList: { flex: 1, minWidth: "300px" },
  emptyProducts: { textAlign: "center", padding: "40px", color: "#888", background: "#fff", borderRadius: "12px" },
  productItem: { display: "flex", alignItems: "center", gap: "12px", background: "#fff", padding: "12px 16px", borderRadius: "10px", marginBottom: "10px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" },
  pImg: { width: "64px", height: "52px", objectFit: "cover", borderRadius: "6px", flexShrink: 0 },
  pInfo: { flex: 1, display: "flex", flexDirection: "column", gap: "2px" },
  pCat: { fontSize: "11px", background: "#ff9900", color: "#fff", padding: "2px 8px", borderRadius: "10px", width: "fit-content" },
  pActions: { display: "flex", gap: "8px" },
  editBtn: { background: "#3498db", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "12px" },
  delBtn: { background: "#e74c3c", color: "#fff", border: "none", padding: "6px 10px", borderRadius: "6px", cursor: "pointer", fontSize: "12px" },
};
