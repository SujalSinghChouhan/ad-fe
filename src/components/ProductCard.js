import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useWishlist } from "../context/WishlistContext";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Plus, Heart } from "lucide-react";

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const navigate = useNavigate();
  const [added, setAdded] = useState(false);
  const liked = isWishlisted(product);

  const handleAddToCart = (e) => {
    e.stopPropagation();
    if (!user) return navigate("/login");
    addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const handleWishlist = (e) => {
    e.stopPropagation();
    toggleWishlist(product);
  };

  const stockStatus = product.stock === 0 ? "out" : product.stock <= 5 ? "low" : "ok";

  return (
    <div
      onClick={() => navigate(`/product/${product._id || product.id}`)}
      className="bg-white rounded-3xl shadow-sm overflow-hidden cursor-pointer active:scale-95 transition-all duration-200"
    >
      {/* Image */}
      <div className="relative aspect-square">
        <img
          src={product.image || "https://placehold.co/300x300?text=No+Image"}
          alt={product.name}
          className="w-full h-full object-cover"
          onError={(e) => { e.target.src = "https://placehold.co/300x300?text=No+Image"; }}
        />
        {/* Wishlist */}
        <button
          onClick={handleWishlist}
          className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all duration-200 active:scale-90 ${liked ? "bg-red-500" : "bg-white/90"}`}
        >
          <Heart size={14} className={liked ? "text-white fill-white" : "text-gray-400"} />
        </button>
        {/* Category Badge */}
        <span className="absolute top-2 left-2 bg-white/90 text-gray-700 text-[10px] font-bold px-2 py-1 rounded-full">
          {product.category}
        </span>
      </div>

      {/* Body */}
      <div className="p-3">
        {/* Seller */}
        <p className="text-[10px] text-gray-400 font-medium mb-1">Sold by {product.shopkeeperName}</p>

        {/* Name */}
        <h3 className="text-sm font-bold text-gray-900 leading-tight mb-1 line-clamp-2">{product.name}</h3>

        {/* Stock Badge */}
        {stockStatus === "out" && (
          <span className="inline-block bg-red-100 text-out-stock text-[10px] font-bold px-2 py-0.5 rounded-full mb-2">Out of Stock</span>
        )}
        {stockStatus === "low" && (
          <span className="inline-block bg-orange-100 text-low-stock text-[10px] font-bold px-2 py-0.5 rounded-full mb-2">
            🔥 Only {product.stock} left
          </span>
        )}
        {stockStatus === "ok" && product.stock && (
          <span className="inline-block bg-green-100 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full mb-2">
            ✓ {product.stock} in stock
          </span>
        )}

        {/* Price + Add */}
        <div className="flex items-center justify-between mt-1">
          <span className="text-base font-black text-primary">₹{product.price}</span>
          {stockStatus !== "out" && (user?.role === "customer" || !user) && (
            <button
              onClick={handleAddToCart}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90 ${added ? "bg-green-600" : "bg-primary"}`}
            >
              <Plus size={16} className="text-white" strokeWidth={3} />
            </button>
          )}
          {stockStatus === "out" && (
            <button disabled className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center cursor-not-allowed">
              <Plus size={16} className="text-gray-400" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
