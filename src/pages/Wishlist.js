import { useWishlist } from "../context/WishlistContext";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Wishlist() {
  const { wishlist, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleAddToCart = (product) => {
    if (!user) return navigate("/login");
    addToCart(product);
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h2 style={styles.title}>❤️ My Wishlist</h2>
        <span style={styles.count}>{wishlist.length} item{wishlist.length !== 1 ? "s" : ""} saved</span>
      </div>

      {wishlist.length === 0 ? (
        <div style={styles.emptyBox}>
          <div style={styles.emptyIcon}>💔</div>
          <h3 style={styles.emptyTitle}>Your wishlist is empty</h3>
          <p style={styles.emptySub}>Save products you love by clicking the ❤️ on any product</p>
          <button style={styles.shopBtn} onClick={() => navigate("/")}>Start Shopping</button>
        </div>
      ) : (
        <div style={styles.grid}>
          {wishlist.map((product) => (
            <div key={product._id || product.id} style={styles.card}>
              {/* Remove button */}
              <button style={styles.removeBtn} onClick={() => removeFromWishlist(product._id || product.id)}>✕</button>

              {/* Image */}
              <div style={styles.imgWrapper} onClick={() => navigate(`/product/${product._id || product.id}`)}>
                <img
                  src={product.image || "https://placehold.co/280x200?text=No+Image"}
                  alt={product.name}
                  style={styles.img}
                  onError={(e) => { e.target.src = "https://placehold.co/280x200?text=No+Image"; }}
                />
                <span style={styles.catBadge}>{product.category}</span>
              </div>

              {/* Info */}
              <div style={styles.body}>
                <h3 style={styles.name} onClick={() => navigate(`/product/${product._id || product.id}`)}>
                  {product.name}
                </h3>
                <p style={styles.seller}>🏪 {product.shopkeeperName}</p>
                <p style={styles.desc}>{product.description}</p>

                <div style={styles.priceRow}>
                  <span style={styles.price}>₹{product.price}</span>
                  <span style={styles.rating}>⭐ 4.5</span>
                </div>

                <div style={styles.btnRow}>
                  <button style={styles.cartBtn} onClick={() => handleAddToCart(product)}>
                    🛒 Add to Cart
                  </button>
                  <button style={styles.buyBtn} onClick={() => { handleAddToCart(product); navigate("/cart"); }}>
                    ⚡ Buy Now
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { maxWidth: "1100px", margin: "0 auto", padding: "24px" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" },
  title: { color: "#232f3e", margin: 0, fontSize: "24px" },
  count: { background: "#fff3e0", color: "#e65100", padding: "6px 16px", borderRadius: "20px", fontWeight: "bold", fontSize: "14px" },
  emptyBox: { textAlign: "center", padding: "80px 24px", background: "#fff", borderRadius: "16px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" },
  emptyIcon: { fontSize: "64px", marginBottom: "16px" },
  emptyTitle: { color: "#232f3e", fontSize: "22px", margin: "0 0 8px" },
  emptySub: { color: "#888", fontSize: "15px", margin: "0 0 24px" },
  shopBtn: { background: "#ff9900", border: "none", padding: "12px 32px", borderRadius: "8px", fontWeight: "bold", fontSize: "15px", cursor: "pointer" },
  grid: { display: "flex", flexWrap: "wrap", gap: "20px", justifyContent: "flex-start" },
  card: { background: "#fff", borderRadius: "14px", boxShadow: "0 2px 12px rgba(0,0,0,0.08)", width: "260px", overflow: "hidden", position: "relative" },
  removeBtn: { position: "absolute", top: "10px", right: "10px", background: "rgba(0,0,0,0.5)", color: "#fff", border: "none", borderRadius: "50%", width: "26px", height: "26px", cursor: "pointer", fontSize: "12px", zIndex: 2, display: "flex", alignItems: "center", justifyContent: "center" },
  imgWrapper: { position: "relative", cursor: "pointer" },
  img: { width: "100%", height: "180px", objectFit: "cover", display: "block" },
  catBadge: { position: "absolute", bottom: "8px", left: "8px", background: "#ff9900", color: "#fff", fontSize: "11px", padding: "3px 10px", borderRadius: "10px", fontWeight: "bold" },
  body: { padding: "14px" },
  name: { margin: "0 0 4px", fontSize: "15px", fontWeight: "bold", color: "#232f3e", cursor: "pointer" },
  seller: { margin: "0 0 4px", fontSize: "12px", color: "#888" },
  desc: { margin: "0 0 10px", fontSize: "12px", color: "#777", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" },
  priceRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" },
  price: { fontWeight: "bold", color: "#232f3e", fontSize: "18px" },
  rating: { fontSize: "13px", color: "#f39c12" },
  btnRow: { display: "flex", gap: "8px" },
  cartBtn: { flex: 1, background: "#ff9900", border: "none", padding: "9px 6px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "12px", color: "#fff" },
  buyBtn: { flex: 1, background: "#232f3e", border: "none", padding: "9px 6px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "12px", color: "#fff" },
};
