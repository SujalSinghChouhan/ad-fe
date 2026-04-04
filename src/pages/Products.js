import { useState, useEffect, useRef, useCallback, useMemo, memo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { Star, Plus, ShoppingCart, ChevronLeft, SlidersHorizontal, X, Sparkles, ChevronDown, ChevronUp, Zap } from "lucide-react";
import { safeFetch } from "../utils/safeFetch";

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
const ProductCard = memo(function ProductCard({ product, onAdd, onBuy, addedId }) {
  const navigate = useNavigate();
  const originalPrice = product.originalPrice || Math.round(product.price * 1.25);
  const discount = Math.round(((originalPrice - product.price) / originalPrice) * 100);
  const isAdded = addedId === (product._id || product.id);
  return (
    <div onClick={() => navigate(`/product/${product._id || product.id}`)}
      className="bg-white rounded-2xl shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-all duration-200 hover:-translate-y-1 group">
      <div className="relative overflow-hidden">
        <img src={product.image} alt={product.name}
          loading="lazy" decoding="async"
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
        {isAdded && (
          <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
            <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">✓ Added!</span>
          </div>
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
});

const CATEGORIES = ["All", "Groceries", "Electronics", "Fashion", "Daily Needs", "Local Shops", "Fruits", "Dairy", "Bakery", "Organic", "Kids", "Beauty", "Sports", "Home Decor"];
const SORT_OPTIONS = [
  { label: "Relevance", value: "newest" },
  { label: "Price: Low to High", value: "price_asc" },
  { label: "Price: High to Low", value: "price_desc" },
  { label: "Top Rated", value: "rating" },
];
const PRICE_RANGES = [
  { label: "Under ₹500", min: 0, max: 500 },
  { label: "₹500 – ₹1,000", min: 500, max: 1000 },
  { label: "₹1,000 – ₹5,000", min: 1000, max: 5000 },
  { label: "₹5,000 – ₹10,000", min: 5000, max: 10000 },
  { label: "Above ₹10,000", min: 10000, max: Infinity },
];
const MIN_RATINGS = [4, 3, 2];

// ── AI Tag extraction: scans product text and returns relevant smart tags ──
const TAG_KEYWORDS = [
  // Watches
  "stainless steel", "waterproof", "analog", "digital", "chronograph", "automatic", "quartz",
  "leather strap", "metal strap", "smart watch", "fitness tracker", "gps", "heart rate",
  // Electronics
  "wireless", "bluetooth", "noise cancelling", "fast charging", "usb-c", "hdmi", "4k",
  "led", "oled", "amoled", "touchscreen", "android", "ios", "wifi", "5g", "4g",
  "gaming", "mechanical", "rgb", "portable", "rechargeable", "solar",
  // Fashion / Clothing
  "cotton", "polyester", "silk", "wool", "denim", "slim fit", "regular fit", "oversized",
  "casual", "formal", "ethnic", "western", "handmade", "embroidered", "printed",
  "full sleeve", "half sleeve", "sleeveless",
  // Footwear
  "running", "walking", "sports", "casual shoes", "formal shoes", "sandals", "sneakers",
  "anti-slip", "lightweight", "breathable",
  // Groceries / Food
  "organic", "gluten free", "sugar free", "vegan", "whole grain", "low fat", "high protein",
  "fresh", "frozen", "packaged", "natural", "preservative free",
  // Beauty
  "spf", "moisturizing", "anti-aging", "paraben free", "cruelty free", "herbal", "ayurvedic",
  "vitamin c", "hyaluronic", "retinol", "sulfate free",
  // Home
  "wooden", "metal", "plastic", "foldable", "wall mount", "decorative", "minimalist",
  "handcrafted", "eco friendly", "bamboo",
  // Kids
  "educational", "non toxic", "age 3+", "age 5+", "battery operated", "remote control",
  // Sports
  "gym", "yoga", "cycling", "swimming", "outdoor", "indoor", "professional",
];

function extractAITags(products) {
  if (!products.length) return [];
  const text = products.map(p =>
    `${p.name} ${p.description || ""} ${p.brand || ""}`.toLowerCase()
  ).join(" ");
  return TAG_KEYWORDS.filter(tag => text.includes(tag.toLowerCase()));
}

// ── AI Filter Sidebar ──
function FilterSidebar({ open, onClose, filters, onChange, aiTags, tagsLoading }) {
  const [openSections, setOpenSections] = useState({ smartTags: true, category: false, price: true, rating: true, discount: false });
  const toggle = (s) => setOpenSections(p => ({ ...p, [s]: !p[s] }));

  const Section = ({ id, title, badge, children }) => (
    <div className="border-b border-gray-100 pb-4 mb-4">
      <button onClick={() => toggle(id)} className="w-full flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-black text-gray-800">{title}</span>
          {badge && <span className="bg-orange-100 text-orange-500 text-[9px] font-black px-1.5 py-0.5 rounded-full">{badge}</span>}
        </div>
        {openSections[id] ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
      </button>
      {openSections[id] && children}
    </div>
  );

  const hasActiveFilters = filters.category !== "All" || filters.priceRange || filters.minRating || filters.discount || filters.tags?.length;

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />}

      <aside className={`
        fixed top-0 left-0 h-full w-72 bg-white z-50
        shadow-2xl rounded-r-2xl overflow-y-auto
        transition-transform duration-300
        ${open ? "translate-x-0" : "-translate-x-full"}
      `}>
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-orange-400 rounded-xl flex items-center justify-center shadow-sm">
                <Sparkles size={15} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-black text-gray-900">AI Filters</p>
                <p className="text-[10px] text-gray-400 leading-tight">Smart tags from your results</p>
              </div>
            </div>
            <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-all">
              <X size={14} className="text-gray-600" />
            </button>
          </div>

          {/* Clear all */}
          {hasActiveFilters && (
            <button onClick={() => onChange({ category: "All", priceRange: null, minRating: null, discount: false, tags: [], sort: filters.sort })}
              className="w-full text-xs font-bold text-orange-500 bg-orange-50 py-2 rounded-xl mb-4 hover:bg-orange-100 transition-all">
              ✕ Clear All Filters
            </button>
          )}

          {/* ── AI Smart Tags ── */}
          <Section id="smartTags" title="Smart Tags" badge="AI">
            {tagsLoading ? (
              <div className="flex items-center gap-2 py-2">
                <div className="w-4 h-4 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-gray-400">Analyzing products...</span>
              </div>
            ) : aiTags.length === 0 ? (
              <p className="text-xs text-gray-400 italic">No smart tags found for this search</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {aiTags.map(tag => {
                  const active = filters.tags?.includes(tag);
                  return (
                    <button key={tag}
                      onClick={() => {
                        const current = filters.tags || [];
                        onChange({ ...filters, tags: active ? current.filter(t => t !== tag) : [...current, tag] });
                      }}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize transition-all border ${
                        active
                          ? "bg-violet-600 text-white border-violet-600 shadow-sm"
                          : "bg-gray-50 text-gray-600 border-gray-200 hover:border-violet-300 hover:text-violet-600"
                      }`}>
                      {active && <span className="mr-1">✓</span>}{tag}
                    </button>
                  );
                })}
              </div>
            )}
          </Section>

          {/* Category */}
          <Section id="category" title="Category">
            <div className="space-y-1">
              {CATEGORIES.map(cat => (
                <button key={cat} onClick={() => onChange({ ...filters, category: cat })}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    filters.category === cat ? "bg-orange-500 text-white" : "text-gray-600 hover:bg-gray-50"
                  }`}>
                  {cat}
                </button>
              ))}
            </div>
          </Section>

          {/* Price Range */}
          <Section id="price" title="Price Range">
            <div className="space-y-1">
              {PRICE_RANGES.map(r => (
                <button key={r.label} onClick={() => onChange({ ...filters, priceRange: filters.priceRange?.label === r.label ? null : r })}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    filters.priceRange?.label === r.label ? "bg-orange-500 text-white" : "text-gray-600 hover:bg-gray-50"
                  }`}>
                  {r.label}
                </button>
              ))}
            </div>
          </Section>

          {/* Min Rating */}
          <Section id="rating" title="Customer Rating">
            <div className="space-y-1">
              {MIN_RATINGS.map(r => (
                <button key={r} onClick={() => onChange({ ...filters, minRating: filters.minRating === r ? null : r })}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    filters.minRating === r ? "bg-orange-500 text-white" : "text-gray-600 hover:bg-gray-50"
                  }`}>
                  <div className="flex">
                    {[1,2,3,4,5].map(s => <Star key={s} size={10} className={s <= r ? "text-yellow-400 fill-yellow-400" : (filters.minRating === r ? "text-white/40" : "text-gray-300 fill-gray-300")} />)}
                  </div>
                  {r}+ Stars
                </button>
              ))}
            </div>
          </Section>

          {/* Discount */}
          <Section id="discount" title="Discount">
            <button onClick={() => onChange({ ...filters, discount: !filters.discount })}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                filters.discount ? "bg-orange-500 text-white" : "text-gray-600 hover:bg-gray-50"
              }`}>
              On Sale / Discounted
            </button>
          </Section>
        </div>
      </aside>
    </>
  );
}

export default function Products() {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const params = new URLSearchParams(location.search);
  const searchQuery = params.get("search") || "";
  const categoryQuery = params.get("category") || "All";

  const [allProducts, setAllProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const loadingRef = useRef(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [addedId, setAddedId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showSort, setShowSort] = useState(false);

  const [filters, setFilters] = useState({
    category: categoryQuery,
    priceRange: null,
    minRating: null,
    discount: false,
    tags: [],
    sort: "newest",
  });
  const [aiTags, setAiTags] = useState([]);

  // Sync category from URL
  useEffect(() => {
    setFilters(f => ({ ...f, category: categoryQuery, tags: [] }));
  }, [categoryQuery]);

  const loaderRef = useRef(null);
  const observerRef = useRef(null);

  const fetchProducts = useCallback(async (pageNum, reset = false) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const p = new URLSearchParams({ page: pageNum, limit: 20, sort: filters.sort });
      if (filters.category && filters.category !== "All") p.append("category", filters.category);
      if (searchQuery) p.append("search", searchQuery);
      const res = await safeFetch(`/api/products?${p}`);
      const data = await res.json();
      if (data.products) {
        setAllProducts(prev => reset ? data.products : [...prev, ...data.products]);
        setHasMore(data.hasMore);
      }
    } catch (err) {
      console.error(err);
    } finally {
      loadingRef.current = false;
      setLoading(false);
      setInitialLoading(false);
    }
  }, [searchQuery, filters.category, filters.sort]);

  useEffect(() => {
    setAllProducts([]);
    setPage(1);
    setHasMore(true);
    setInitialLoading(true);
    fetchProducts(1, true);
  }, [searchQuery, filters.category, filters.sort]);

  useEffect(() => {
    if (page > 1) fetchProducts(page);
  }, [page]);

  const hasMoreRef = useRef(hasMore);
  hasMoreRef.current = hasMore;
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting && hasMoreRef.current && !loadingRef.current) setPage(p => p + 1); },
      { threshold: 0.1, rootMargin: "200px" }
    );
    if (loaderRef.current) observerRef.current.observe(loaderRef.current);
    return () => observerRef.current?.disconnect();
  }, []);

  // Re-extract AI tags whenever allProducts changes
  useEffect(() => {
    if (!allProducts.length) { setAiTags([]); return; }
    setAiTags(extractAITags(allProducts));
  }, [allProducts]);

  // Client-side filter: price, rating, discount, AI tags
  const products = useMemo(() => allProducts.filter(p => {
    if (filters.priceRange) {
      const { min, max } = filters.priceRange;
      if (p.price < min || p.price > max) return false;
    }
    if (filters.minRating && (p.rating || 4) < filters.minRating) return false;
    if (filters.discount) {
      const orig = p.originalPrice || Math.round(p.price * 1.25);
      if (orig <= p.price) return false;
    }
    if (filters.tags?.length) {
      const text = `${p.name} ${p.description || ""} ${p.brand || ""}`.toLowerCase();
      if (!filters.tags.every(tag => text.includes(tag.toLowerCase()))) return false;
    }
    return true;
  }), [allProducts, filters]);

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

  const activeFilterCount = [
    filters.category !== "All",
    !!filters.priceRange,
    !!filters.minRating,
    filters.discount,
    !!(filters.tags?.length),
  ].filter(Boolean).length;

  const title = searchQuery
    ? `Results for "${searchQuery}"`
    : filters.category !== "All"
    ? filters.category
    : "All Products";

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-4">

        {/* Top Bar */}
        <div className="flex items-center justify-between mb-4 gap-3">
          <div className="flex items-center gap-3">
            {/* Back */}
            <button onClick={() => navigate("/")}
              className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-sm hover:bg-gray-100 transition-all flex-shrink-0">
              <ChevronLeft size={18} className="text-gray-700" />
            </button>

            {/* 3-dash AI Filter button */}
            <button onClick={() => setSidebarOpen(true)}
              className="relative flex items-center gap-2 bg-gray-900 text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-gray-700 transition-all shadow-sm flex-shrink-0">
              <div className="flex flex-col gap-[3px]">
                <span className="block w-4 h-[2px] bg-white rounded-full" />
                <span className="block w-3 h-[2px] bg-white rounded-full" />
                <span className="block w-4 h-[2px] bg-white rounded-full" />
              </div>
              <Sparkles size={13} className="text-orange-400" />
              Filters
              {activeFilterCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-orange-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>

            <div>
              <h1 className="text-lg font-black text-gray-900 leading-tight">{title}</h1>
              <p className="text-xs text-gray-400">
                {initialLoading ? "Loading..." : `${products.length}${hasMore ? "+" : ""} products`}
              </p>
            </div>
          </div>

          {/* Sort */}
          <div className="relative flex-shrink-0">
            <button onClick={() => setShowSort(!showSort)}
              className="flex items-center gap-2 bg-white border border-gray-200 px-3 py-2 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-sm">
              <SlidersHorizontal size={14} />
              <span className="hidden sm:inline">{SORT_OPTIONS.find(s => s.value === filters.sort)?.label}</span>
            </button>
            {showSort && (
              <div className="absolute right-0 top-full mt-2 bg-white rounded-2xl shadow-xl py-2 z-50 w-52 border border-gray-100">
                {SORT_OPTIONS.map(opt => (
                  <button key={opt.value} onClick={() => { setFilters(f => ({ ...f, sort: opt.value })); setShowSort(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm font-semibold transition-colors ${filters.sort === opt.value ? "text-orange-500 bg-orange-50" : "text-gray-700 hover:bg-gray-50"}`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Active filter chips */}
        {activeFilterCount > 0 && (
          <div className="flex gap-2 mb-4 flex-wrap">
            {filters.category !== "All" && (
              <span className="flex items-center gap-1 bg-orange-100 text-orange-600 text-xs font-bold px-3 py-1.5 rounded-full">
                {filters.category}
                <button onClick={() => setFilters(f => ({ ...f, category: "All" }))}><X size={10} /></button>
              </span>
            )}
            {filters.priceRange && (
              <span className="flex items-center gap-1 bg-blue-100 text-blue-600 text-xs font-bold px-3 py-1.5 rounded-full">
                {filters.priceRange.label}
                <button onClick={() => setFilters(f => ({ ...f, priceRange: null }))}><X size={10} /></button>
              </span>
            )}
            {filters.minRating && (
              <span className="flex items-center gap-1 bg-yellow-100 text-yellow-700 text-xs font-bold px-3 py-1.5 rounded-full">
                {filters.minRating}+ Stars
                <button onClick={() => setFilters(f => ({ ...f, minRating: null }))}><X size={10} /></button>
              </span>
            )}
            {filters.discount && (
              <span className="flex items-center gap-1 bg-green-100 text-green-600 text-xs font-bold px-3 py-1.5 rounded-full">
                On Sale
                <button onClick={() => setFilters(f => ({ ...f, discount: false }))}><X size={10} /></button>
              </span>
            )}
            {filters.tags?.map(tag => (
              <span key={tag} className="flex items-center gap-1 bg-violet-100 text-violet-600 text-xs font-bold px-3 py-1.5 rounded-full capitalize">
                <Zap size={9} />{tag}
                <button onClick={() => setFilters(f => ({ ...f, tags: f.tags.filter(t => t !== tag) }))}><X size={10} /></button>
              </span>
            ))}
          </div>
        )}

        {/* Filter Sidebar — slide-in on all screens */}
        <FilterSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} filters={filters} onChange={(f) => { setFilters(f); }} aiTags={aiTags} tagsLoading={false} />

        {/* Products */}
        <div className="flex-1 min-w-0">
            {initialLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
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
            ) : products.length === 0 ? (
              <div className="text-center py-24">
                <p className="text-6xl mb-4">🔍</p>
                <p className="text-gray-700 font-black text-lg">No products found</p>
                <p className="text-gray-400 text-sm mt-1">Try adjusting your filters or search term</p>
                <button onClick={() => setFilters({ category: "All", priceRange: null, minRating: null, discount: false, sort: "newest" })}
                  className="mt-4 bg-orange-500 text-white font-bold px-6 py-2.5 rounded-full hover:bg-orange-600 transition-all">
                  Clear Filters
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {products.map(p => (
                    <ProductCard key={p._id || p.id} product={p} onAdd={handleAdd} onBuy={handleBuy} addedId={addedId} />
                  ))}
                </div>
                <div ref={loaderRef} className="py-8 flex justify-center">
                  {loading && (
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm text-gray-400 font-medium">Loading more...</span>
                    </div>
                  )}
                  {!hasMore && products.length > 0 && (
                    <p className="text-sm text-gray-400 font-medium">✓ All products loaded</p>
                  )}
                </div>
              </>
            )}
        </div>
      </div>
    </div>
  );
}
