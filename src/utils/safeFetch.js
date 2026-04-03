const SAFE_PREFIXES = ["/api/", "/api"];
const API_BASE = process.env.REACT_APP_API_URL || "";

function isSafeUrl(url) {
  if (!url) return false;
  if (SAFE_PREFIXES.some((p) => url.startsWith(p))) return true;
  if (API_BASE && url.startsWith(API_BASE)) return true;
  try {
    const parsed = new URL(url);
    return parsed.origin === window.location.origin;
  } catch {
    return false;
  }
}

export async function safeFetch(url, options) {
  const fullUrl = url.startsWith("/api") ? `${API_BASE}${url}` : url;
  if (!isSafeUrl(url)) throw new Error("Blocked: unsafe or untrusted URL");
  return window.fetch(fullUrl, options);
}
