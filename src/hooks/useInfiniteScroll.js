import { useState, useEffect, useRef, useCallback } from "react";

const ALLOWED_ORIGIN = window.location.origin;
function isSafeUrl(url) {
  if (!url) return false;
  if (url.startsWith("/")) return true;
  try { return new URL(url).origin === ALLOWED_ORIGIN; } catch { return false; }
}

export default function useInfiniteScroll({ category = "", search = "", sort = "newest", limit = 12 }) {
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const observerRef = useRef(null);
  const loaderRef = useRef(null);

  const fetchProducts = useCallback(async (pageNum, reset = false) => {
    if (loading) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: pageNum, limit });
      if (category && category !== "All") params.append("category", category);
      if (search) params.append("search", search);
      if (sort) params.append("sort", sort);

      const safeUrl = `/api/products?${params}`;
      if (!isSafeUrl(safeUrl)) return;
      const res = await fetch(safeUrl);
      const data = await res.json();

      if (data.products) {
        setProducts(prev => reset ? data.products : [...prev, ...data.products]);
        setHasMore(data.hasMore);
      }
    } catch (err) {
      console.error("Failed to fetch products:", err);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [category, search, sort, limit]);

  // Reset when filters change
  useEffect(() => {
    setProducts([]);
    setPage(1);
    setHasMore(true);
    setInitialLoading(true);
    fetchProducts(1, true);
  }, [category, search, sort]);

  // Load more when page changes
  useEffect(() => {
    if (page > 1) fetchProducts(page);
  }, [page]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          setPage(prev => prev + 1);
        }
      },
      { threshold: 0.1 }
    );
    if (loaderRef.current) observerRef.current.observe(loaderRef.current);
    return () => observerRef.current?.disconnect();
  }, [hasMore, loading]);

  return { products, loading, initialLoading, hasMore, loaderRef };
}
