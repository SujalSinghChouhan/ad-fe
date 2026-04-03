import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useTheme } from "../context/ThemeContext";
import { useState } from "react";
import { Search, ShoppingCart, Bell, User, MapPin, Heart, Home, Grid, Bike, Store, Moon, Sun, Menu, X, ChevronDown } from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const { wishlist } = useWishlist();
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isActive = (path) => location.pathname === path;

  const handleSearch = (e) => {
    if (e.key === "Enter" && search.trim()) {
      navigate(`/?search=${search}`);
      setSearch("");
    }
  };

  return (
    <>
      {/* ── Desktop Navbar ── */}
      <nav className="hidden md:block sticky top-0 z-50 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 shadow-lg">
        {/* Top Bar */}
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-6">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <span className="text-2xl">🛒</span>
            <div>
              <p className="text-white font-black text-lg leading-none">Apni Dukaan</p>
              <p className="text-orange-400 text-[10px] font-medium">The Hyper-Fresh Marketplace</p>
            </div>
          </Link>

          {/* Location */}
          <button className="flex items-center gap-1.5 text-white/80 hover:text-white transition-colors flex-shrink-0">
            <MapPin size={14} className="text-orange-400" />
            <div className="text-left">
              <p className="text-[10px] text-white/50">Deliver to</p>
              <p className="text-xs font-bold flex items-center gap-1">
                {user?.location || "Mumbai"} <ChevronDown size={10} />
              </p>
            </div>
          </button>

          {/* Search */}
          <div className="flex-1 flex items-center bg-white rounded-full overflow-hidden shadow-sm">
            <input
              className="flex-1 px-4 py-2.5 text-sm outline-none text-gray-800 font-medium placeholder-gray-400"
              placeholder="Search for products, brands and more..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={handleSearch}
            />
            <button onClick={() => { if (search.trim()) navigate(`/?search=${search}`); }}
              className="bg-orange-500 hover:bg-orange-600 px-5 py-2.5 flex items-center gap-2 transition-colors">
              <Search size={16} className="text-white" />
              <span className="text-white text-sm font-bold">Search</span>
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Dark Mode */}
            <button onClick={theme.toggle} className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-all">
              {theme.dark ? <Sun size={16} className="text-yellow-400" /> : <Moon size={16} className="text-white" />}
            </button>

            {/* Wishlist */}
            <button onClick={() => navigate("/wishlist")} className="relative w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-all">
              <Heart size={16} className="text-white" />
              {wishlist.length > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{wishlist.length}</span>}
            </button>

            {/* Cart */}
            <button onClick={() => navigate("/cart")} className="relative flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-full transition-all active:scale-95">
              <ShoppingCart size={16} />
              <span className="text-sm font-bold">Cart</span>
              {cart.length > 0 && <span className="bg-white text-orange-500 text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center">{cart.length}</span>}
            </button>

            {/* Profile */}
            {user ? (
              <div className="relative group">
                <button className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-full transition-all">
                  <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-xs font-black">
                    {user.name[0].toUpperCase()}
                  </div>
                  <span className="text-sm font-bold">{user.name.split(" ")[0]}</span>
                </button>
                {/* Dropdown */}
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  {[
                    { label: "My Profile", path: "/profile", icon: "👤" },
                    { label: "My Orders", path: "/orders", icon: "📦" },
                    { label: "Wishlist", path: "/wishlist", icon: "❤️" },
                    ...(user.role === "shopkeeper" ? [{ label: "Dashboard", path: "/shopkeeper/dashboard", icon: "🏪" }] : []),
                    ...(user.role === "deliveryBoy" ? [{ label: "Deliveries", path: "/delivery/dashboard", icon: "🛵" }] : []),
                    ...(user.role === "admin" ? [{ label: "Admin Panel", path: "/admin/dashboard", icon: "🛡️" }] : []),
                  ].map(item => (
                    <button key={item.path} onClick={() => navigate(item.path)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-orange-50 hover:text-orange-500 transition-colors">
                      <span>{item.icon}</span>{item.label}
                    </button>
                  ))}
                  <div className="border-t border-gray-100 mt-1 pt-1">
                    <button onClick={() => { logout(); navigate("/login"); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors">
                      <span>🚪</span>Logout
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <Link to="/login" className="bg-white text-gray-900 text-sm font-bold px-4 py-2 rounded-full hover:bg-gray-100 transition-all">Login</Link>
                <Link to="/register" className="bg-orange-500 text-white text-sm font-bold px-4 py-2 rounded-full hover:bg-orange-600 transition-all">Register</Link>
              </div>
            )}
          </div>
        </div>

        {/* Category Nav */}
        <div className="border-t border-white/10">
          <div className="max-w-7xl mx-auto px-6 py-2 flex items-center gap-6 overflow-x-auto scrollbar-hide">
            {["All", "Groceries", "Electronics", "Fashion", "Daily Needs", "Local Shops", "Fruits", "Dairy"].map(cat => (
              <button key={cat} onClick={() => navigate(cat === "All" ? "/" : `/?category=${cat}`)}
                className="text-white/70 hover:text-white text-xs font-semibold whitespace-nowrap transition-colors hover:text-orange-400 flex-shrink-0">
                {cat}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* ── Mobile Top Bar ── */}
      <div className="md:hidden sticky top-0 z-50 bg-gradient-to-r from-gray-900 to-gray-800 px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo + Location */}
          <div className="flex items-center gap-2">
            <span className="text-xl">🛒</span>
            <div>
              <p className="text-white font-black text-sm leading-none">Apni Dukaan</p>
              <div className="flex items-center gap-1">
                <MapPin size={10} className="text-orange-400" />
                <p className="text-white/60 text-[10px]">{user?.location || "Mumbai"}</p>
              </div>
            </div>
          </div>

          {/* Right Icons */}
          <div className="flex items-center gap-2">
            <button onClick={theme.toggle} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10">
              {theme.dark ? <Sun size={14} className="text-yellow-400" /> : <Moon size={14} className="text-white" />}
            </button>
            <button onClick={() => navigate("/wishlist")} className="relative w-8 h-8 flex items-center justify-center rounded-full bg-white/10">
              <Heart size={14} className="text-white" />
              {wishlist.length > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center">{wishlist.length}</span>}
            </button>
            <button onClick={() => navigate("/cart")} className="relative w-8 h-8 flex items-center justify-center rounded-full bg-orange-500">
              <ShoppingCart size={14} className="text-white" />
              {cart.length > 0 && <span className="absolute -top-1 -right-1 bg-white text-orange-500 text-[8px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center">{cart.length}</span>}
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile Bottom Nav ── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 shadow-[0_-8px_24px_rgba(0,0,0,0.06)]">
        <div className="flex items-center justify-around px-2 py-2">
          {[
            { icon: Home, label: "Home", path: "/" },
            { icon: Grid, label: "Categories", path: "/?categories=true" },
            { icon: ShoppingCart, label: "Cart", path: "/cart", badge: cart.length },
            { icon: Heart, label: "Wishlist", path: "/wishlist", badge: wishlist.length },
            { icon: User, label: "Account", path: user ? "/profile" : "/login" },
          ].map((item) => {
            const active = isActive(item.path);
            return (
              <button key={item.path} onClick={() => navigate(item.path)}
                className="flex flex-col items-center gap-0.5 px-3 py-1 relative">
                <div className={`p-1.5 rounded-xl transition-all ${active ? "bg-orange-100" : ""}`}>
                  <item.icon size={20} className={active ? "text-orange-500" : "text-gray-400"} />
                  {item.badge > 0 && (
                    <span className="absolute top-0 right-1 bg-orange-500 text-white text-[8px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className={`text-[9px] font-bold ${active ? "text-orange-500" : "text-gray-400"}`}>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
