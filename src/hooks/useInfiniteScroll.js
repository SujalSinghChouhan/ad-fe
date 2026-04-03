import { useState, useEffect, useRef, useCallback } from "react";
import { safeFetch } from "../utils/safeFetch";

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

      const res = await safeFetch(`/api/products?${params}`);
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
  }, [category, search, sort, limit]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setProducts([]);
    setPage(1);
    setHasMore(true);
    setInitialLoading(true);
    fetchProducts(1, true);
  }, [category, search, sort]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (page > 1) fetchProducts(page);
  }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) setPage(prev => prev + 1);
      },
      { threshold: 0.1 }
    );
    if (loaderRef.current) observerRef.current.observe(loaderRef.current);
    return () => observerRef.current?.disconnect();
  }, [hasMore, loading]);

  return { products, loading, initialLoading, hasMore, loaderRef };
}
