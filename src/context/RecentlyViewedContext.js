import { createContext, useContext, useState } from "react";

const RecentlyViewedContext = createContext();

export function RecentlyViewedProvider({ children }) {
  const [viewed, setViewed] = useState(() => {
    const saved = localStorage.getItem("apniDukaanRecentlyViewed");
    return saved ? JSON.parse(saved) : [];
  });

  const addViewed = (product) => {
    setViewed((prev) => {
      const filtered = prev.filter((p) => (p._id || p.id) !== (product._id || product.id));
      const updated = [product, ...filtered].slice(0, 5);
      localStorage.setItem("apniDukaanRecentlyViewed", JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <RecentlyViewedContext.Provider value={{ viewed, addViewed }}>
      {children}
    </RecentlyViewedContext.Provider>
  );
}

export const useRecentlyViewed = () => useContext(RecentlyViewedContext);
