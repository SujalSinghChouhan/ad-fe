const SAFE_PREFIXES = ["/api/", "/api"];

function isSafeUrl(url) {
  if (!url) return false;
  if (SAFE_PREFIXES.some((p) => url.startsWith(p))) return true;
  try {
    const parsed = new URL(url);
    return parsed.origin === window.location.origin;
  } catch {
    return false;
  }
}

export async function safeFetch(url, options) {
  if (!isSafeUrl(url)) throw new Error("Blocked: unsafe or untrusted URL");
  return window.fetch(url, options);
}
