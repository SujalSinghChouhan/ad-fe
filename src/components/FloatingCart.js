import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom";
import { ShoppingCart, X, Plus, Minus } from "lucide-react";
import { useState } from "react";

export default function FloatingCart() {
  const { cart, total, updateQty, removeFromCart } = useCart();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  if (cart.length === 0) return null;

  return (
    <div className="fixed bottom-24 md:bottom-8 right-4 z-50">
      {/* Cart Preview Popup */}
      {open && (
        <div className="absolute bottom-16 right-0 w-80 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden mb-2 animate-in slide-in-from-bottom-4">
          <div className="bg-gray-900 px-4 py-3 flex items-center justify-between">
            <span className="text-white font-black text-sm">🛒 Cart ({cart.length})</span>
            <button onClick={() => setOpen(false)} className="text-white/60 hover:text-white">
              <X size={16} />
            </button>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {cart.map((item) => (
              <div key={item._id || item.id} className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <img src={item.image || "https://placehold.co/48x48?text=No"} alt={item.name}
                  className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                  onError={(e) => { e.target.src = "https://placehold.co/48x48?text=No"; }} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-gray-900 line-clamp-1">{item.name}</p>
                  <p className="text-sm font-black text-orange-500">₹{item.price}</p>
                </div>
                <div className="flex items-center gap-1 bg-gray-100 rounded-full px-2 py-1">
                  <button onClick={() => updateQty(item._id || item.id, item.quantity - 1)} className="active:scale-90 transition-all">
                    <Minus size={10} className="text-gray-600" />
                  </button>
                  <span className="text-xs font-black w-4 text-center">{item.quantity}</span>
                  <button onClick={() => updateQty(item._id || item.id, item.quantity + 1)} className="active:scale-90 transition-all">
                    <Plus size={10} className="text-orange-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="px-4 py-3 bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold text-gray-600">Total</span>
              <span className="text-lg font-black text-orange-500">₹{total}</span>
            </div>
            <button onClick={() => { navigate("/cart"); setOpen(false); }}
              className="w-full bg-orange-500 text-white font-black py-3 rounded-full text-sm hover:bg-orange-600 active:scale-95 transition-all">
              Proceed to Checkout →
            </button>
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button onClick={() => setOpen(!open)}
        className="relative bg-orange-500 hover:bg-orange-600 text-white w-14 h-14 rounded-full shadow-2xl flex items-center justify-center active:scale-90 transition-all">
        <ShoppingCart size={22} />
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
          {cart.length}
        </span>
      </button>
    </div>
  );
}
