const API_BASE = process.env.REACT_APP_API_URL
  ? process.env.REACT_APP_API_URL
  : process.env.NODE_ENV === "production"
  ? "https://ad-be-1.onrender.com"
  : "";

export async function safeFetch(url, options) {
  const fullUrl = url.startsWith("/api") ? `${API_BASE}${url}` : url;
  return window.fetch(fullUrl, options);
}
