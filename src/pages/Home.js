import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useTheme } from "../context/ThemeContext";
import { useRecentlyViewed } from "../context/RecentlyViewedContext";
import { useLocation2 } from "../context/LocationContext";
import { ChevronRight, Star, Plus, ShoppingCart, Search, MapPin, ChevronLeft, ShoppingBag, Monitor, Shirt, Home as HomeIcon, Store, Apple, Milk, Cake, LayoutGrid, Navigation } from "lucide-react";
import useInfiniteScroll from "../hooks/useInfiniteScroll";
import shops from "../data/shops";

// ── Star Rating ──
function StarRating({ rating, size = 12 }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(s => (
        <Star key={s} size={size} className={s <= Math.round(rating) ? "text-yellow-400 fill-yellow-400" : "text-gray-200 fill-gray-200"} />
      ))}
    </div>
  );
}

// ── Product Card ──
function ProductCard({ product, onAdd, onBuy }) {
  const navigate = useNavigate();
  const originalPrice = product.originalPrice || Math.round(product.price * 1.25);
  const discount = Math.round(((originalPrice - product.price) / originalPrice) * 100);
  return (
    <div onClick={() => navigate(`/product/${product._id || product.id}`)}
      className="bg-white rounded-2xl shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-all duration-200 hover:-translate-y-1 group">
      <div className="relative overflow-hidden">
        <img src={product.image} alt={product.name}
          className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => { e.target.src = "https://placehold.co/300x300?text=No+Image"; }} />
        {discount > 0 && (
          <span className="absolute top-2 left-2 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            {discount}% OFF
          </span>
        )}
        {product.stock <= 5 && product.stock > 0 && (
          <span className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            Only {product.stock} left
          </span>
        )}
      </div>
      <div className="p-3">
        <p className="text-[10px] text-gray-400 font-medium mb-0.5">{product.brand || product.shopkeeperName || ""}</p>
        <h3 className="text-sm font-bold text-gray-900 line-clamp-2 mb-1">{product.name}</h3>
        <div className="flex items-center gap-1 mb-2">
          <StarRating rating={product.rating || 4} />
          <span className="text-[10px] text-gray-400">({product.reviews || 0})</span>
        </div>
        <div className="flex items-center justify-between mb-2">
          <div>
            <span className="text-base font-black text-orange-500">₹{product.price?.toLocaleString()}</span>
            {originalPrice > product.price && (
              <span className="text-xs text-gray-400 line-through ml-1">₹{originalPrice.toLocaleString()}</span>
            )}
          </div>
          <button onClick={(e) => { e.stopPropagation(); onAdd(product); }}
            className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center hover:bg-orange-600 active:scale-90 transition-all shadow-sm">
            <Plus size={14} className="text-white" strokeWidth={3} />
          </button>
        </div>
        <button onClick={(e) => { e.stopPropagation(); onBuy(product); }}
          className="w-full bg-gray-900 text-white text-[11px] font-bold py-1.5 rounded-full hover:bg-gray-700 active:scale-95 transition-all flex items-center justify-center gap-1">
          <ShoppingCart size={11} /> Buy Now
        </button>
      </div>
    </div>
  );
}

// ── Shop Card ──
function ShopCard({ shop }) {
  const navigate = useNavigate();
  return (
    <div onClick={() => navigate(`/?category=${shop.category}`)}
      className="min-w-[200px] bg-white rounded-2xl shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-all duration-200 flex-shrink-0">
      <img src={shop.image} alt={shop.name} className="w-full h-28 object-cover"
        onError={(e) => { e.target.src = "https://placehold.co/200x112?text=Shop"; }} />
      <div className="p-3">
        <h3 className="text-sm font-bold text-gray-900">{shop.name}</h3>
        <p className="text-xs text-gray-400">{shop.category}</p>
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-1">
            <Star size={10} className="text-yellow-400 fill-yellow-400" />
            <span className="text-xs font-bold text-gray-700">{shop.rating}</span>
          </div>
          <span className="text-xs text-orange-500 font-semibold">{shop.deliveryTime}</span>
        </div>
      </div>
    </div>
  );
}

const CATEGORIES = [
  { name: "Groceries",   Icon: ShoppingBag, color: "bg-green-100",  iconColor: "text-green-600" },
  { name: "Electronics", Icon: Monitor,     color: "bg-blue-100",   iconColor: "text-blue-600" },
  { name: "Fashion",     Icon: Shirt,       color: "bg-pink-100",   iconColor: "text-pink-600" },
  { name: "Daily Needs", Icon: HomeIcon,     color: "bg-yellow-100", iconColor: "text-yellow-600" },
  { name: "Local Shops", Icon: Store,       color: "bg-purple-100", iconColor: "text-purple-600" },
  { name: "Fruits",      Icon: Apple,       color: "bg-red-100",    iconColor: "text-red-600" },
  { name: "Dairy",       Icon: Milk,        color: "bg-cyan-100",   iconColor: "text-cyan-600" },
  { name: "Bakery",      Icon: Cake,        color: "bg-orange-100", iconColor: "text-orange-600" },
];

const BANNERS = [
  {
    bg: "from-[#1a1a2e] via-[#16213e] to-[#0f3460]",
    image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&auto=format&fit=crop&q=90",
    tag: "🔥 Today's Deal",
    tagColor: "bg-orange-500",
    title: "Big Electronics",
    highlight: "Sale!",
    highlightColor: "text-orange-400",
    sub: "FLAT 50% OFF",
    desc: "Fast Delivery in 10-20 Minutes",
    cta: "Shop Now",
    ctaBg: "bg-orange-500 hover:bg-orange-600",
    badge: "-50%",
    badgeColor: "bg-orange-500",
    accent: "#f97316",
    category: "Electronics",
  },
  {
    bg: "from-[#0a2e1a] via-[#0d4a2a] to-[#166534]",
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=90",
    tag: "🥬 Farm Fresh",
    tagColor: "bg-green-500",
    title: "Fresh Groceries",
    highlight: "Daily!",
    highlightColor: "text-green-400",
    sub: "Farm to Doorstep",
    desc: "Order before 10 AM for same day delivery",
    cta: "Order Now",
    ctaBg: "bg-green-500 hover:bg-green-600",
    badge: "Fresh",
    badgeColor: "bg-green-500",
    accent: "#22c55e",
    category: "Groceries",
  },
  {
    bg: "from-[#0c1445] via-[#1a237e] to-[#283593]",
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&auto=format&fit=crop&q=90",
    tag: "📱 New Arrivals",
    tagColor: "bg-blue-500",
    title: "Smartphones",
    highlight: "Sale!",
    highlightColor: "text-cyan-400",
    sub: "Up to 40% OFF",
    desc: "Latest gadgets at unbeatable prices",
    cta: "Explore",
    ctaBg: "bg-blue-500 hover:bg-blue-600",
    badge: "-40%",
    badgeColor: "bg-blue-500",
    accent: "#3b82f6",
    category: "Electronics",
  },
  {
    bg: "from-[#3b0764] via-[#6b21a8] to-[#7e22ce]",
    image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&auto=format&fit=crop&q=90",
    tag: "👗 Fashion Week",
    tagColor: "bg-pink-500",
    title: "Style Sale",
    highlight: "2+1 Free!",
    highlightColor: "text-pink-300",
    sub: "Buy 2 Get 1 FREE",
    desc: "Trending fashion at amazing prices",
    cta: "Shop Fashion",
    ctaBg: "bg-pink-500 hover:bg-pink-600",
    badge: "2+1",
    badgeColor: "bg-pink-500",
    accent: "#ec4899",
    category: "Fashion",
  },
  {
    bg: "from-[#1c1917] via-[#292524] to-[#44403c]",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=90",
    tag: "🎧 Audio Deals",
    tagColor: "bg-violet-500",
    title: "Premium Audio",
    highlight: "Starting ₹999",
    highlightColor: "text-violet-400",
    sub: "Best Sound Experience",
    desc: "Top headphones & earbuds collection",
    cta: "Listen Now",
    ctaBg: "bg-violet-500 hover:bg-violet-600",
    badge: "Hot",
    badgeColor: "bg-violet-500",
    accent: "#8b5cf6",
    category: "Electronics",
  },
  {
    bg: "from-[#451a03] via-[#92400e] to-[#b45309]",
    image: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800&auto=format&fit=crop&q=90",
    tag: "🍯 Organic",
    tagColor: "bg-amber-500",
    title: "Healthy Living",
    highlight: "Go Organic!",
    highlightColor: "text-amber-300",
    sub: "Pure & Natural Products",
    desc: "Best organic products for your family",
    cta: "Go Healthy",
    ctaBg: "bg-amber-500 hover:bg-amber-600",
    badge: "New",
    badgeColor: "bg-amber-500",
    accent: "#f59e0b",
    category: "Groceries",
  },
];

export default function Home() {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { viewed } = useRecentlyViewed();
  const { location: userLocation, clearLocation } = useLocation2();
  const [category, setCategory] = useState("All");
  const [slide, setSlide] = useState(0);
  const [addedId, setAddedId] = useState(null);
  const [sortBy, setSortBy] = useState("newest");
  const [nearbyShops, setNearbyShops] = useState([]);
  const [nearbyLoading, setNearbyLoading] = useState(false);

  // Read search & category from URL
  const params = new URLSearchParams(location.search);
  const search = params.get("search") || "";

  useEffect(() => {
    const urlCategory = params.get("category");
    if (urlCategory) setCategory(urlCategory);
  }, [location.search]);

  // Infinite scroll hook
  const { products, loading, initialLoading, hasMore, loaderRef } = useInfiniteScroll({
    category, search, sort: sortBy, limit: 12,
  });

  // Fetch nearby shopkeepers when location is available
  useEffect(() => {
    if (!userLocation?.lat || !userLocation?.lon) return;
    setNearbyLoading(true);
    fetch(`/api/auth/nearby-shopkeepers?lat=${userLocation.lat}&lon=${userLocation.lon}&radius=20`)
      .then(r => r.json())
      .then(data => { setNearbyShops(Array.isArray(data) ? data : []); })
      .catch(() => {})
      .finally(() => setNearbyLoading(false));
  }, [userLocation?.lat, userLocation?.lon]);

  // Trending - first 5 from API
  const [trending, setTrending] = useState([]);
  useEffect(() => {
    fetch("/api/products?page=1&limit=5&sort=newest")
      .then(r => r.json())
      .then(d => setTrending(d.products || []));
  }, []);

  const nextSlide = useCallback(() => setSlide(s => (s + 1) % BANNERS.length), []);
  useEffect(() => { const t = setInterval(nextSlide, 4000); return () => clearInterval(t); }, [nextSlide]);

  const handleAdd = (product) => {
    if (!user) return navigate("/login");
    addToCart(product);
    setAddedId(product._id || product.id);
    setTimeout(() => setAddedId(null), 1500);
  };

  const handleBuy = (product) => {
    if (!user) return navigate("/login");
    addToCart(product);
    navigate("/cart");
  };

  const filtered = products;
  const freshPicks = products.filter(p => ["Groceries", "Fruits", "Dairy", "Grocery"].includes(p.category)).slice(0, 6);

  // Platform stats
  const [stats, setStats] = useState({ totalProducts: 0, totalShopkeepers: 0, totalOrders: 0, totalCategories: 0 });
  useEffect(() => {
    fetch("/api/products/stats")
      .then(r => r.json())
      .then(d => setStats(d))
      .catch(() => {});
  }, []);

  return (
    <div className={`min-h-screen ${theme.dark ? "bg-gray-900" : "bg-gray-50"} pb-20 md:pb-0`}>

      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">

        {/* ── Location Bar ── */}
        {userLocation && !userLocation.skipped && (
          <div className="flex items-center justify-between bg-orange-50 border border-orange-100 rounded-2xl px-4 py-2.5 mt-3">
            <div className="flex items-center gap-2 min-w-0">
              <MapPin size={14} className="text-orange-500 flex-shrink-0" />
              <span className="text-xs font-semibold text-gray-700 truncate">
                {userLocation.address ? userLocation.address.split(",").slice(0, 3).join(",") : "Location set"}
              </span>
            </div>
            <button onClick={clearLocation} className="text-[11px] text-orange-500 font-bold flex-shrink-0 ml-2 hover:text-orange-600">Change</button>
          </div>
        )}

        {/* ── Hero Banner ── */}
        {!search && (
          <div className="py-4">
            <div className={`relative bg-gradient-to-r ${BANNERS[slide].bg} rounded-3xl overflow-hidden`} style={{ minHeight: "260px" }}>

              {/* Full background image with dark overlay */}
              <img src={BANNERS[slide].image} alt={BANNERS[slide].title}
                className="absolute inset-0 w-full h-full object-cover opacity-20 scale-105"
                style={{ transition: "opacity 0.5s ease" }}
              />

              {/* Animated particles/dots */}
              <div className="absolute inset-0 overflow-hidden">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="absolute rounded-full opacity-10 animate-pulse"
                    style={{
                      width: `${40 + i * 20}px`, height: `${40 + i * 20}px`,
                      background: BANNERS[slide].accent,
                      top: `${10 + i * 12}%`, left: `${5 + i * 15}%`,
                      animationDelay: `${i * 0.3}s`,
                    }} />
                ))}
              </div>

              {/* Content */}
              <div className="relative z-10 flex items-center justify-between p-6 md:p-10 h-full">
                {/* Left Content */}
                <div className="flex-1 max-w-sm">
                  {/* Tag */}
                  <span className={`inline-flex items-center gap-1 ${BANNERS[slide].tagColor} text-white text-xs font-black px-3 py-1.5 rounded-full mb-4 shadow-lg`}>
                    {BANNERS[slide].tag}
                  </span>

                  {/* Title */}
                  <h1 className="text-white text-3xl md:text-5xl font-black leading-tight mb-1">
                    {BANNERS[slide].title}
                    <span className={`block ${BANNERS[slide].highlightColor}`}>{BANNERS[slide].highlight}</span>
                  </h1>

                  {/* Sub */}
                  <p className="text-white/80 text-sm md:text-base mb-2 font-semibold">{BANNERS[slide].sub}</p>
                  <p className="text-white/60 text-xs md:text-sm mb-6">{BANNERS[slide].desc}</p>

                  {/* CTA Buttons */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => { setCategory(BANNERS[slide].category); navigate(`/products?category=${BANNERS[slide].category}`); }}
                      className={`${BANNERS[slide].ctaBg} text-white font-black px-6 py-3 rounded-full text-sm active:scale-95 transition-all shadow-lg flex items-center gap-2`}>
                      {BANNERS[slide].cta} <ChevronRight size={16} />
                    </button>
                    <button
                      onClick={() => navigate("/products")}
                      className="bg-white/10 backdrop-blur-sm border border-white/20 text-white font-bold px-4 py-3 rounded-full text-sm hover:bg-white/20 transition-all">
                      View All
                    </button>
                  </div>

                  {/* Stats row */}
                  <div className="flex items-center gap-4 mt-5">
                    {["10K+ Products", "Free Delivery", "24/7 Support"].map((s, i) => (
                      <div key={i} className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: BANNERS[slide].accent }} />
                        <span className="text-white/60 text-[10px] font-semibold">{s}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right Product Image */}
                <div className="hidden sm:flex flex-col items-center gap-3 flex-shrink-0 ml-6">
                  {/* Main image with 3D effect */}
                  <div className="relative">
                    <div className="absolute inset-0 rounded-2xl blur-2xl opacity-40 scale-110" style={{ background: BANNERS[slide].accent }} />
                    <img src={BANNERS[slide].image} alt={BANNERS[slide].title}
                      className="relative w-44 h-44 md:w-60 md:h-60 object-cover rounded-2xl shadow-2xl border-2 border-white/10"
                      style={{ transform: "perspective(1000px) rotateY(-12deg) rotateX(5deg) scale(1.02)" }}
                    />
                    {/* Discount badge on image */}
                    <div className={`absolute -top-3 -right-3 ${BANNERS[slide].badgeColor} text-white text-sm font-black w-12 h-12 rounded-full flex items-center justify-center shadow-lg border-2 border-white`}>
                      {BANNERS[slide].badge}
                    </div>
                  </div>

                  {/* Mini product thumbnails */}
                  <div className="flex gap-2">
                    {BANNERS.filter((_, i) => i !== slide).slice(0, 3).map((b, i) => (
                      <img key={i} src={b.image} alt=""
                        className="w-10 h-10 rounded-xl object-cover opacity-50 hover:opacity-100 cursor-pointer transition-all border border-white/20"
                        onClick={() => setSlide(BANNERS.indexOf(b))}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom bar with dots + timer */}
              <div className="absolute bottom-0 left-0 right-0 px-6 py-3 flex items-center justify-between bg-black/20 backdrop-blur-sm">
                {/* Dots */}
                <div className="flex gap-1.5">
                  {BANNERS.map((_, i) => (
                    <button key={i} onClick={() => setSlide(i)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${i === slide ? "w-8" : "w-2 bg-white/30"}`}
                      style={i === slide ? { background: BANNERS[slide].accent } : {}} />
                  ))}
                </div>

                {/* Slide info */}
                <div className="flex items-center gap-3">
                  <span className="text-white/50 text-[10px] font-bold">{slide + 1} / {BANNERS.length}</span>
                  <div className="flex gap-1">
                    <button onClick={() => setSlide(s => (s - 1 + BANNERS.length) % BANNERS.length)}
                      className="w-7 h-7 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all">
                      <ChevronLeft size={14} className="text-white" />
                    </button>
                    <button onClick={nextSlide}
                      className="w-7 h-7 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all">
                      <ChevronRight size={14} className="text-white" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Shops Near You ── */}
        {!search && userLocation?.lat && (
          <div className="py-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                  <Navigation size={18} className="text-orange-500" /> Shops Near You
                </h2>
                <p className="text-xs text-gray-400">Within 20km of your location</p>
              </div>
            </div>
            {nearbyLoading ? (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="min-w-[180px] bg-white rounded-2xl overflow-hidden shadow-sm flex-shrink-0">
                    <div className="h-24 bg-gray-200 animate-pulse" />
                    <div className="p-3 space-y-2">
                      <div className="h-3 bg-gray-200 rounded-full animate-pulse w-3/4" />
                      <div className="h-3 bg-gray-200 rounded-full animate-pulse w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : nearbyShops.length === 0 ? (
              <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
                <p className="text-3xl mb-2">🏪</p>
                <p className="text-sm font-bold text-gray-700">No shops found within 20km</p>
                <p className="text-xs text-gray-400 mt-1">Try browsing all products instead</p>
              </div>
            ) : (
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {nearbyShops.map(shop => (
                  <div key={shop._id}
                    onClick={() => navigate(`/products?search=${encodeURIComponent(shop.name)}`)}
                    className="min-w-[180px] bg-white rounded-2xl shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-all flex-shrink-0 border border-gray-100">
                    <div className="h-24 bg-gradient-to-br from-orange-100 to-orange-50 flex items-center justify-center">
                      <span className="text-4xl">🏪</span>
                    </div>
                    <div className="p-3">
                      <h3 className="text-sm font-black text-gray-900 line-clamp-1">{shop.name}</h3>
                      <p className="text-xs text-gray-400 mt-0.5">{shop.location}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[10px] bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full">
                          ✓ Open
                        </span>
                        <span className="text-[10px] bg-orange-100 text-orange-600 font-bold px-2 py-0.5 rounded-full">
                          📍 {shop.distanceKm} km
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Live Platform Stats ── */}
        {!search && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 py-4">
            {[
              { label: "Products Listed",    value: "150+", Icon: ShoppingBag, bg: "bg-orange-50",  iconBg: "bg-orange-100", iconColor: "text-orange-500" },
              { label: "Active Shopkeepers", value: "10+",  Icon: Store,       bg: "bg-purple-50",  iconBg: "bg-purple-100", iconColor: "text-purple-500" },
              { label: "Delivery Partners",  value: "5+",   Icon: ShoppingCart,bg: "bg-blue-50",    iconBg: "bg-blue-100",   iconColor: "text-blue-500" },
              { label: "Categories",         value: "10+",  Icon: LayoutGrid,  bg: "bg-green-50",   iconBg: "bg-green-100",  iconColor: "text-green-500" },
            ].map((s) => (
              <div key={s.label} className={`${s.bg} rounded-2xl p-4 flex items-center gap-3`}>
                <div className={`${s.iconBg} w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0`}>
                  <s.Icon size={22} className={s.iconColor} />
                </div>
                <div>
                  <p className={`text-2xl font-black ${s.iconColor}`}>{s.value}</p>
                  <p className="text-xs text-gray-500 font-medium">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Categories ── */}
        {!search && (
          <div className="py-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black text-gray-900">Shop by Category</h2>
              <button className="text-orange-500 text-sm font-bold flex items-center gap-1">See all <ChevronRight size={14} /></button>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {[{ name: "All", Icon: LayoutGrid, color: "bg-gray-100", iconColor: "text-gray-600" }, ...CATEGORIES].map((cfg) => {
                const isActive = category === cfg.name;
                return (
                  <button key={cfg.name} onClick={() => { setCategory(cfg.name); navigate(cfg.name === "All" ? "/" : `/products?category=${cfg.name}`); }}
                    className="flex-shrink-0 flex flex-col items-center gap-2 transition-all duration-200 active:scale-95">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 ${
                      isActive ? "bg-orange-500 shadow-lg shadow-orange-200 scale-110" : cfg.color
                    }`}>
                      <cfg.Icon size={26} className={isActive ? "text-white" : cfg.iconColor} strokeWidth={1.8} />
                    </div>
                    <span className={`text-xs font-bold whitespace-nowrap ${isActive ? "text-orange-500" : "text-gray-600"}`}>
                      {cfg.name === "All" ? "All" : cfg.name.split(" ")[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Search Results ── */}
        {search && (
          <div className="py-4">
            <h2 className="text-lg font-black text-gray-900 mb-4">
              Results for "{search}" <span className="text-gray-400 font-medium text-sm">({filtered.length})</span>
            </h2>
            {filtered.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-5xl mb-3">🔍</p>
                <p className="text-gray-500 font-medium">No products found</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {filtered.map(p => (
                  <div key={p._id || p.id} className="relative">
                    <ProductCard product={p} onAdd={handleAdd} onBuy={handleBuy} />
                    {addedId === (p._id || p.id) && (
                      <div className="absolute inset-0 bg-green-500/20 rounded-2xl flex items-center justify-center">
                        <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">✓ Added!</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Trending Products ── */}
        {!search && (
          <div className="py-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-black text-gray-900">🔥 Trending Now</h2>
                <p className="text-xs text-gray-400">Most popular products this week</p>
              </div>
              <button onClick={() => navigate("/products")} className="text-orange-500 text-sm font-bold flex items-center gap-1">
                See all <ChevronRight size={14} />
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {trending.map(p => (
                <div key={p._id || p.id} className="relative">
                  <ProductCard product={p} onAdd={handleAdd} onBuy={handleBuy} />
                  {addedId === (p._id || p.id) && (
                    <div className="absolute inset-0 bg-green-500/20 rounded-2xl flex items-center justify-center">
                      <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">✓ Added!</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Category Products ── */}
        {!search && category !== "All" && (
          <div className="py-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black text-gray-900">{category}</h2>
              <button onClick={() => navigate("/products")} className="text-gray-400 text-sm font-bold">← All</button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {filtered.map(p => (
                <div key={p._id || p.id} className="relative">
                  <ProductCard product={p} onAdd={handleAdd} onBuy={handleBuy} />
                  {addedId === (p._id || p.id) && (
                    <div className="absolute inset-0 bg-green-500/20 rounded-2xl flex items-center justify-center">
                      <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">✓ Added!</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Promo Banner ── */}
        {!search && category === "All" && (
          <div className="py-2">
            <div className="bg-gradient-to-r from-green-600 to-emerald-500 rounded-3xl p-6 flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm font-medium">Limited Time</p>
                <h3 className="text-white text-xl font-black">Free Delivery</h3>
                <p className="text-white/70 text-xs mt-1">On orders above ₹500</p>
              </div>
              <div className="text-5xl">🚚</div>
            </div>
          </div>
        )}

        {/* ── Fresh Picks ── */}
        {!search && category === "All" && (
          <div className="py-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-black text-gray-900">🥬 Fresh Picks</h2>
                <p className="text-xs text-gray-400">Delivered fresh from local farms</p>
              </div>
              <button onClick={() => navigate("/products")} className="text-orange-500 text-sm font-bold flex items-center gap-1">See all <ChevronRight size={14} /></button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {freshPicks.map(p => (
                <div key={p._id || p.id} className="relative">
                  <ProductCard product={p} onAdd={handleAdd} onBuy={handleBuy} />
                  {addedId === (p._id || p.id) && (
                    <div className="absolute inset-0 bg-green-500/20 rounded-2xl flex items-center justify-center">
                      <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">✓ Added!</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Local Shops ── */}
        {!search && category === "All" && (
          <div className="py-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-black text-gray-900">🏪 Local Shops</h2>
                <p className="text-xs text-gray-400">Shop from stores near you</p>
              </div>
              <button className="text-orange-500 text-sm font-bold flex items-center gap-1">See all <ChevronRight size={14} /></button>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {shops.map(shop => <ShopCard key={shop.id} shop={shop} />)}
            </div>
          </div>
        )}

        {/* ── Recently Viewed ── */}
        {!search && viewed.length > 0 && (
          <div className="py-4">
            <h2 className="text-lg font-black text-gray-900 mb-4">👁️ Recently Viewed</h2>
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {viewed.map(p => (
                <div key={p._id || p.id} className="min-w-[140px] flex-shrink-0 bg-white rounded-2xl shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-all"
                  onClick={() => navigate(`/product/${p._id || p.id}`)}>
                  <img src={p.image} alt={p.name} className="w-full h-24 object-cover"
                    onError={(e) => { e.target.src = "https://placehold.co/140x96?text=No"; }} />
                  <div className="p-2">
                    <p className="text-xs font-bold text-gray-900 line-clamp-1">{p.name}</p>
                    <p className="text-sm font-black text-orange-500">₹{p.price}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── All Products (Infinite Scroll) ── */}
        {!search && category === "All" && (
          <div className="py-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-black text-gray-900">🛒 All Products</h2>
                <p className="text-xs text-gray-400">Scroll to load more automatically</p>
              </div>
            </div>
            {initialLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm">
                    <div className="aspect-square bg-gray-200 animate-pulse" />
                    <div className="p-3 space-y-2">
                      <div className="h-3 bg-gray-200 rounded-full animate-pulse w-3/4" />
                      <div className="h-3 bg-gray-200 rounded-full animate-pulse w-1/2" />
                      <div className="flex justify-between">
                        <div className="h-4 bg-gray-200 rounded-full animate-pulse w-16" />
                        <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {products.map(p => (
                    <div key={p._id || p.id} className="relative">
                      <ProductCard product={p} onAdd={handleAdd} onBuy={handleBuy} />
                      {addedId === (p._id || p.id) && (
                        <div className="absolute inset-0 bg-green-500/20 rounded-2xl flex items-center justify-center">
                          <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">✓ Added!</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Infinite Scroll Loader */}
                <div ref={loaderRef} className="py-8 flex justify-center">
                  {loading && (
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm text-gray-400 font-medium">Loading more products...</span>
                    </div>
                  )}
                  {!hasMore && products.length > 0 && (
                    <p className="text-sm text-gray-400 font-medium">✓ All products loaded</p>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Footer ── */}
        <footer className="py-8 mt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
            {[
              { title: "Company", links: ["About Us", "Careers", "Press", "Blog"] },
              { title: "Support", links: ["Help Center", "Contact Us", "Returns", "Track Order"] },
              { title: "Legal", links: ["Privacy Policy", "Terms of Service", "Cookie Policy"] },
              { title: "Follow Us", links: ["Instagram", "Twitter", "Facebook", "YouTube"] },
            ].map(col => (
              <div key={col.title}>
                <h4 className="text-sm font-black text-gray-900 mb-3">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map(link => (
                    <li key={link}><a href="#" className="text-xs text-gray-500 hover:text-orange-500 transition-colors">{link}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 pt-4 border-t border-gray-100">
            <p className="text-sm font-black text-gray-900">🛒 Apni Dukaan</p>
            <p className="text-xs text-gray-400">© 2026 Apni Dukaan. All rights reserved.</p>
            <div className="flex gap-3">
              {["🍎 App Store", "🤖 Play Store"].map(s => (
                <button key={s} className="bg-gray-900 text-white text-xs font-bold px-3 py-1.5 rounded-full hover:bg-gray-700 transition-all">{s}</button>
              ))}
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
