import { createContext, useContext, useState } from "react";

const WishlistContext = createContext();

export function WishlistProvider({ children }) {
  const [wishlist, setWishlist] = useState(() => {
    const saved = localStorage.getItem("apniDukaanWishlist");
    return saved ? JSON.parse(saved) : [];
  });

  const toggleWishlist = (product) => {
    setWishlist((prev) => {
      const exists = prev.find((p) => (p._id || p.id) === (product._id || product.id));
      const updated = exists
        ? prev.filter((p) => (p._id || p.id) !== (product._id || product.id))
        : [...prev, product];
      localStorage.setItem("apniDukaanWishlist", JSON.stringify(updated));
      return updated;
    });
  };

  const isWishlisted = (product) =>
    wishlist.some((p) => (p._id || p.id) === (product._id || product.id));

  const removeFromWishlist = (id) => {
    setWishlist((prev) => {
      const updated = prev.filter((p) => (p._id || p.id) !== id);
      localStorage.setItem("apniDukaanWishlist", JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <WishlistContext.Provider value={{ wishlist, toggleWishlist, isWishlisted, removeFromWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => useContext(WishlistContext);
