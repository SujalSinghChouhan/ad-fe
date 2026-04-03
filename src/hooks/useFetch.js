import { useState, useEffect, useCallback } from "react";
import { safeFetch } from "../utils/safeFetch";

export default function useFetch(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  const fetchData = useCallback(async () => {
    if (!url) return;
    setLoading(true); setError(null);
    try {
      const res = await safeFetch(url);
      if (!res.ok) {
        setError({ code: res.status, message: res.status === 404 ? "Resource not found" : "Server error occurred" });
        return;
      }
      setData(await res.json());
    } catch {
      setError(!navigator.onLine
        ? { code: "network", message: "No internet connection." }
        : { code: 500, message: "Something went wrong. Please try again." }
      );
    } finally { setLoading(false); }
  }, [url, retryCount]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchData(); }, [fetchData]);

  return { data, loading, error, retry: () => setRetryCount(c => c + 1) };
}
