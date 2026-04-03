import { useState, useEffect, useCallback } from "react";

const ALLOWED_ORIGIN = window.location.origin;
function isSafeUrl(url) {
  if (!url) return false;
  if (url.startsWith("/")) return true;
  try { return new URL(url).origin === ALLOWED_ORIGIN; } catch { return false; }
}

export default function useFetch(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  const fetchData = useCallback(async () => {
    if (!url) return;
    setLoading(true); setError(null);
    try {
      if (!isSafeUrl(url)) { setError({ code: 400, message: "Invalid request URL." }); setLoading(false); return; }
      const res = await fetch(url);
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
  }, [url, retryCount]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { data, loading, error, retry: () => setRetryCount(c => c + 1) };
}
