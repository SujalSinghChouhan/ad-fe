import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useWishlist } from "../context/WishlistContext";
import { useRecentlyViewed } from "../context/RecentlyViewedContext";
import { ArrowLeft, Share2, Heart, Minus, Plus, Star, ShoppingCart, ChevronLeft, ChevronRight, ShieldCheck, RotateCcw, Truck, BadgeCheck } from "lucide-react";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, cart, updateQty } = useCart();
  const { user } = useAuth();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const { addViewed } = useRecentlyViewed();
  const [product, setProduct] = useState(null);
  const [error, setError] = useState(false);
  const [qty, setQty] = useState(1);
  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [myRating, setMyRating] = useState(0);
  const [myComment, setMyComment] = useState("");
  const [reviewMsg, setReviewMsg] = useState("");
  const [imgIndex, setImgIndex] = useState(0);

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.message) return setError(true);
        setProduct(data);
        addViewed(data);
      })
      .catch(() => setError(true));
    fetch(`/api/reviews/${id}`)
      .then((r) => r.json())
      .then((data) => { setReviews(data.reviews || []); setAvgRating(data.avg || 0); setReviewCount(data.count || 0); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const cartItem = cart.find(i => String(i._id || i.id) === String(id));

  const handleAddToCart = () => {
    if (!user) return navigate("/login");
    for (let i = 0; i < qty; i++) addToCart(product);
  };

  const handleBuyNow = () => {
    if (!user) return navigate("/login");
    for (let i = 0; i < qty; i++) addToCart(product);
    navigate("/cart");
  };

  const submitReview = async () => {
    if (!user) return navigate("/login");
    if (!myRating) return setReviewMsg("Please select a rating");
    await fetch("/api/reviews", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: id, customerId: user.id, customerName: user.name, rating: myRating, comment: myComment }),
    });
    setReviewMsg("✅ Review submitted!");
    fetch(`/api/reviews/${id}`).then((r) => r.json()).then((data) => { setReviews(data.reviews || []); setAvgRating(data.avg || 0); setReviewCount(data.count || 0); });
  };

  if (error) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8">
      <p className="text-5xl">😕</p>
      <h2 className="text-xl font-black text-gray-900">Product not found</h2>
      <button onClick={() => navigate("/")} className="bg-primary text-white font-bold px-6 py-3 rounded-full">← Back to Home</button>
    </div>
  );

  if (!product) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const liked = isWishlisted(product);
  const stockStatus = product.stock === 0 ? "out" : product.stock <= 5 ? "low" : "ok";
  const images = (product.images && product.images.length > 0) ? product.images : [product.image];
  const prevImg = () => setImgIndex(i => (i - 1 + images.length) % images.length);
  const nextImg = () => setImgIndex(i => (i + 1) % images.length);
  const discountedPrice = Math.round(product.price * 1.25);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb / Back */}
      <div className="bg-white border-b border-gray-200 px-4 md:px-8 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline font-medium">
          <ArrowLeft size={15} /> Back to results
        </button>
        <span className="text-gray-300">|</span>
        <span className="text-sm text-gray-500 truncate">{product.category} › {product.name}</span>
      </div>

      {/* ── Main Product Section ── */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* ── LEFT: Image Gallery ── */}
          <div className="lg:w-[420px] flex-shrink-0">
            <div className="flex gap-3 sticky top-4">
              {/* Thumbnail column */}
              {images.length > 1 && (
                <div className="flex flex-col gap-2 w-14">
                  {images.map((img, i) => (
                    <button key={i} onClick={() => setImgIndex(i)}
                      className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${i === imgIndex ? "border-orange-500" : "border-gray-200 opacity-60 hover:opacity-100"}`}>
                      <img src={img} alt={`thumb ${i + 1}`} className="w-full h-full object-cover"
                        onError={(e) => { e.target.src = "https://placehold.co/56x56?text=No"; }} />
                    </button>
                  ))}
                </div>
              )}

              {/* Main image */}
              <div className="flex-1">
                <div className="relative bg-white rounded-2xl border border-gray-200 overflow-hidden" style={{ aspectRatio: "1/1" }}>
                  <img
                    key={imgIndex}
                    src={images[imgIndex] || "https://placehold.co/400x400?text=No+Image"}
                    alt={product.name}
                    className="w-full h-full object-contain p-4"
                    onError={(e) => { e.target.src = "https://placehold.co/400x400?text=No+Image"; }}
                  />
                  {stockStatus === "low" && (
                    <div className="absolute top-3 left-3 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                      🔥 Only {product.stock} left!
                    </div>
                  )}
                  {stockStatus === "out" && (
                    <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                      ❌ Out of Stock
                    </div>
                  )}
                  {images.length > 1 && (
                    <>
                      <button onClick={prevImg} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow hover:bg-white transition-all">
                        <ChevronLeft size={16} className="text-gray-700" />
                      </button>
                      <button onClick={nextImg} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow hover:bg-white transition-all">
                        <ChevronRight size={16} className="text-gray-700" />
                      </button>
                    </>
                  )}
                </div>

                {/* Action buttons under image */}
                <div className="flex gap-2 mt-3">
                  <button onClick={() => toggleWishlist(product)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-semibold transition-all ${liked ? "bg-red-50 border-red-300 text-red-500" : "bg-white border-gray-200 text-gray-600 hover:border-gray-400"}`}>
                    <Heart size={16} className={liked ? "fill-red-500 text-red-500" : ""} />
                    {liked ? "Wishlisted" : "Add to Wishlist"}
                  </button>
                  <button onClick={() => navigator.clipboard.writeText(window.location.href)}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-600 text-sm font-semibold hover:border-gray-400 transition-all">
                    <Share2 size={16} /> Share
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ── RIGHT: Product Info ── */}
          <div className="flex-1 min-w-0">
            {/* Category badge */}
            <span className="inline-block bg-orange-100 text-orange-600 text-xs font-bold px-3 py-1 rounded-full mb-3">{product.category}</span>

            {/* Title */}
            <h1 className="text-2xl font-bold text-gray-900 leading-snug mb-2">{product.name}</h1>

            {/* Seller */}
            <p className="text-sm text-gray-500 mb-3">
              by <span className="text-blue-600 font-semibold hover:underline cursor-pointer">{product.shopkeeperName}</span>
            </p>

            {/* Rating row */}
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-200">
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map(s => (
                  <Star key={s} size={16} className={s <= Math.round(avgRating) ? "text-yellow-400 fill-yellow-400" : "text-gray-300 fill-gray-200"} />
                ))}
              </div>
              <span className="text-orange-500 font-bold text-sm">{avgRating || "New"}</span>
              <span className="text-blue-600 text-sm hover:underline cursor-pointer">{reviewCount} ratings</span>
            </div>

            {/* Price */}
            <div className="mb-4">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-black text-gray-900">₹{product.price?.toLocaleString()}</span>
                <span className="text-lg text-gray-400 line-through">₹{discountedPrice.toLocaleString()}</span>
                <span className="text-green-600 font-bold text-base">Save 20%</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Inclusive of all taxes</p>
            </div>

            {/* Delivery info */}
            <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Truck size={16} className="text-green-600 flex-shrink-0" />
                <span><span className="font-semibold text-green-700">FREE Delivery</span> on orders above ₹500</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <RotateCcw size={16} className="text-blue-600 flex-shrink-0" />
                <span>7 days easy return & exchange</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <ShieldCheck size={16} className="text-orange-500 flex-shrink-0" />
                <span>Secure payments & buyer protection</span>
              </div>
            </div>

            {/* Stock status */}
            <div className="mb-4">
              {stockStatus === "ok" && <p className="text-green-600 font-bold text-sm">✅ In Stock</p>}
              {stockStatus === "low" && <p className="text-orange-500 font-bold text-sm">⚠️ Only {product.stock} left in stock – order soon!</p>}
              {stockStatus === "out" && <p className="text-red-500 font-bold text-sm">❌ Currently unavailable</p>}
            </div>

            {/* Quantity selector */}
            {(user?.role === "customer" || !user) && (
              <div className="mb-4">
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Quantity:</label>
                <div className="flex items-center gap-3 w-fit bg-gray-100 rounded-full px-4 py-2">
                  <button onClick={() => setQty(Math.max(1, qty - 1))} className="active:scale-90 transition-all">
                    <Minus size={16} className="text-gray-700" />
                  </button>
                  <span className="text-base font-black text-gray-900 w-6 text-center">{qty}</span>
                  <button onClick={() => setQty(qty + 1)} className="active:scale-90 transition-all">
                    <Plus size={16} className="text-primary" />
                  </button>
                </div>
              </div>
            )}

            {/* CTA Buttons */}
            {(user?.role === "customer" || !user) && (
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <button
                  onClick={handleAddToCart}
                  disabled={stockStatus === "out"}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-full font-black text-base transition-all active:scale-95 ${stockStatus === "out" ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-yellow-400 hover:bg-yellow-500 text-gray-900"}`}
                >
                  <ShoppingCart size={18} /> Add to Cart
                </button>
                <button
                  onClick={handleBuyNow}
                  disabled={stockStatus === "out"}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-full font-black text-base transition-all active:scale-95 ${stockStatus === "out" ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-orange-500 hover:bg-orange-600 text-white"}`}
                >
                  ⚡ Buy Now
                </button>
              </div>
            )}

            {cartItem && (
              <p className="text-sm text-primary font-semibold mb-4">✓ {cartItem.quantity} already in your cart</p>
            )}

            {/* Description */}
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-base font-bold text-gray-900 mb-2">About this item</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{product.description || "No description available."}</p>
            </div>

            {/* Product Details Grid */}
            <div className="border-t border-gray-200 mt-4 pt-4">
              <h3 className="text-base font-bold text-gray-900 mb-3">Product Details</h3>
              <table className="w-full text-sm">
                <tbody>
                  {[
                    ["Category", product.category],
                    ["Seller", product.shopkeeperName],
                    ["Stock", product.stock > 0 ? `${product.stock} units available` : "Out of Stock"],
                    ["Listed on", new Date(product.createdAt).toLocaleDateString("en-IN")],
                    ["Return Policy", "7 days easy return"],
                    ["Delivery", "Free above ₹500"],
                  ].map(([key, val]) => (
                    <tr key={key} className="border-b border-gray-100">
                      <td className="py-2 pr-4 text-gray-500 font-medium w-36">{key}</td>
                      <td className="py-2 text-gray-800 font-semibold">{val}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── BELOW: Reviews & Ratings ── */}
        <div className="mt-10 bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-xl font-black text-gray-900 mb-6">Customer Reviews & Ratings</h2>

          {/* Rating Summary */}
          {reviewCount > 0 && (
            <div className="flex flex-col sm:flex-row gap-8 mb-8 pb-8 border-b border-gray-200">
              <div className="text-center flex-shrink-0">
                <p className="text-6xl font-black text-gray-900">{avgRating}</p>
                <div className="flex gap-0.5 justify-center mt-2">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} size={18} className={s <= Math.round(avgRating) ? "text-yellow-400 fill-yellow-400" : "text-gray-200 fill-gray-200"} />
                  ))}
                </div>
                <p className="text-sm text-gray-400 mt-1">{reviewCount} ratings</p>
              </div>
              <div className="flex-1 space-y-2">
                {[5,4,3,2,1].map(star => {
                  const count = reviews.filter(r => r.rating === star).length;
                  const pct = reviewCount ? Math.round((count / reviewCount) * 100) : 0;
                  return (
                    <div key={star} className="flex items-center gap-3">
                      <span className="text-sm text-blue-600 hover:underline cursor-pointer w-10 flex-shrink-0">{star} star</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-3">
                        <div className="bg-yellow-400 h-3 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-sm text-gray-500 w-8 text-right">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Write Review */}
          {user?.role === "customer" && (
            <div className="bg-blue-50 rounded-2xl p-5 mb-8">
              <p className="text-base font-black text-gray-900 mb-3">✍️ Write a Customer Review</p>
              <div className="flex gap-2 mb-3">
                {[1,2,3,4,5].map((s) => (
                  <button key={s} onClick={() => setMyRating(s)} className="active:scale-90 transition-all">
                    <Star size={30} className={s <= myRating ? "text-yellow-400 fill-yellow-400" : "text-gray-300 fill-gray-100"} />
                  </button>
                ))}
              </div>
              <textarea
                className="w-full bg-white rounded-xl p-3 text-sm outline-none border border-gray-200 resize-none focus:border-orange-400 transition-colors"
                rows={3} placeholder="Share your experience with this product..."
                value={myComment} onChange={(e) => setMyComment(e.target.value)}
              />
              {reviewMsg && (
                <p className={`text-xs mt-1 font-semibold ${reviewMsg.includes("✅") ? "text-green-600" : "text-red-500"}`}>{reviewMsg}</p>
              )}
              <button onClick={submitReview}
                className="mt-3 bg-orange-500 hover:bg-orange-600 text-white text-sm font-black px-6 py-2.5 rounded-full active:scale-95 transition-all">
                Submit Review
              </button>
            </div>
          )}

          {/* Review List */}
          {reviews.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-4xl mb-2">💬</p>
              <p className="text-gray-400 font-medium">No reviews yet. Be the first to review!</p>
            </div>
          ) : (
            <div className="space-y-5">
              {reviews.map((r) => (
                <div key={r._id} className="border-b border-gray-100 pb-5 last:border-0">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                      {r.customerName[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900 flex items-center gap-1">
                        {r.customerName} <BadgeCheck size={14} className="text-blue-500" />
                      </p>
                      <p className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
                    </div>
                  </div>
                  <div className="flex gap-0.5 mb-2">
                    {[1,2,3,4,5].map((s) => (
                      <Star key={s} size={14} className={s <= r.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-200 fill-gray-200"} />
                    ))}
                  </div>
                  {r.comment && <p className="text-sm text-gray-700 leading-relaxed">{r.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Features Strip ── */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { icon: <Truck size={22} className="text-green-600" />, title: "Free Delivery", sub: "On orders above ₹500" },
            { icon: <RotateCcw size={22} className="text-blue-600" />, title: "7 Day Returns", sub: "Easy return policy" },
            { icon: <BadgeCheck size={22} className="text-orange-500" />, title: "100% Genuine", sub: "Verified products" },
            { icon: <ShieldCheck size={22} className="text-purple-600" />, title: "Secure Payment", sub: "Buyer protection" },
          ].map(({ icon, title, sub }) => (
            <div key={title} className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center gap-3">
              {icon}
              <div>
                <p className="text-sm font-bold text-gray-900">{title}</p>
                <p className="text-xs text-gray-500">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
