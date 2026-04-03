import { X, Star, Plus, Minus, ShoppingCart, Heart } from "lucide-react";
import { useState } from "react";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function QuickView({ product, onClose }) {
  const { addToCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);

  const handleAdd = () => {
    if (!user) { onClose(); return navigate("/login"); }
    for (let i = 0; i < qty; i++) addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 z-10 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-all">
          <X size={16} />
        </button>

        <div className="flex flex-col md:flex-row">
          {/* Image */}
          <div className="relative md:w-1/2">
            <img src={product.image || "https://placehold.co/400x400?text=No+Image"} alt={product.name}
              className="w-full aspect-square object-cover"
              onError={(e) => { e.target.src = "https://placehold.co/400x400?text=No+Image"; }} />
            {discount > 0 && (
              <span className="absolute top-4 left-4 bg-orange-500 text-white text-xs font-black px-3 py-1 rounded-full">
                {discount}% OFF
              </span>
            )}
          </div>

          {/* Details */}
          <div className="md:w-1/2 p-6 flex flex-col justify-between">
            <div>
              <p className="text-xs text-gray-400 font-medium mb-1">{product.brand} • {product.category}</p>
              <h2 className="text-xl font-black text-gray-900 mb-2">{product.name}</h2>

              {/* Rating */}
              <div className="flex items-center gap-2 mb-3">
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} size={14} className={s <= Math.round(product.rating) ? "text-yellow-400 fill-yellow-400" : "text-gray-200 fill-gray-200"} />
                  ))}
                </div>
                <span className="text-sm font-bold text-gray-700">{product.rating}</span>
                <span className="text-xs text-gray-400">({product.reviews} reviews)</span>
              </div>

              {/* Price */}
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl font-black text-orange-500">₹{product.price?.toLocaleString()}</span>
                {product.originalPrice > product.price && (
                  <span className="text-lg text-gray-400 line-through">₹{product.originalPrice?.toLocaleString()}</span>
                )}
              </div>

              {/* Description */}
              <p className="text-sm text-gray-500 leading-relaxed mb-4">{product.description}</p>

              {/* Stock */}
              {product.stock <= 5 && product.stock > 0 && (
                <p className="text-xs font-bold text-red-500 mb-3">🔥 Only {product.stock} left in stock!</p>
              )}
            </div>

            {/* Actions */}
            <div>
              {/* Qty */}
              <div className="flex items-center gap-3 mb-4">
                <span className="text-sm font-bold text-gray-700">Qty:</span>
                <div className="flex items-center gap-3 bg-gray-100 rounded-full px-4 py-2">
                  <button onClick={() => setQty(Math.max(1, qty - 1))} className="active:scale-90 transition-all">
                    <Minus size={14} className="text-gray-600" />
                  </button>
                  <span className="text-sm font-black w-6 text-center">{qty}</span>
                  <button onClick={() => setQty(qty + 1)} className="active:scale-90 transition-all">
                    <Plus size={14} className="text-orange-500" />
                  </button>
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={handleAdd}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-full font-black text-sm transition-all active:scale-95 ${added ? "bg-green-500 text-white" : "bg-orange-500 hover:bg-orange-600 text-white"}`}>
                  <ShoppingCart size={16} />
                  {added ? "Added! ✓" : `Add to Cart • ₹${(product.price * qty)?.toLocaleString()}`}
                </button>
                <button onClick={() => toggleWishlist(product)}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-90 ${isWishlisted(product) ? "bg-red-500 text-white" : "bg-gray-100 text-gray-600"}`}>
                  <Heart size={18} className={isWishlisted(product) ? "fill-white" : ""} />
                </button>
              </div>

              <button onClick={() => { onClose(); navigate(`/product/${product._id || product.id}`); }}
                className="w-full mt-2 text-orange-500 text-sm font-bold py-2 hover:underline">
                View Full Details →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
