const ALLOWED_ORIGIN = window.location.origin;

function isSafeUrl(url) {
  if (!url) return false;
  if (url.startsWith("/")) return true;
  try { return new URL(url).origin === ALLOWED_ORIGIN; } catch { return false; }
}

export async function safeFetch(url, options) {
  if (!isSafeUrl(url)) throw new Error("Blocked: unsafe URL");
  return fetch(url, options);
}
