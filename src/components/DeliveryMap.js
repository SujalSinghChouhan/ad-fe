import { useEffect, useRef, useState } from "react";
import { ExternalLink } from "lucide-react";

function fixLeafletIcons(L) {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
}

function makeIcon(L, color) {
  return L.divIcon({
    className: "",
    html: `<div style="width:32px;height:32px;background:${color};border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
}

// Geocode an address string → {lat, lon}
async function geocodeAddress(address) {
  if (!address) return null;
  try {
    const res = await fetch(`/api/geocode/forward?q=${encodeURIComponent(address)}`);
    const data = await res.json();
    if (data.lat && data.lon) return { lat: data.lat, lon: data.lon };
  } catch {}
  return null;
}

export default function DeliveryMap({ shopAddress, customerAddress, shopName, mode = "customer" }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [status, setStatus] = useState("loading"); // loading | ready | error

  useEffect(() => {
    if (!shopAddress && !customerAddress) { setStatus("error"); return; }

    let map;
    async function initMap() {
      const L = await import("leaflet");
      fixLeafletIcons(L);

      if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; }

      map = L.map(mapRef.current, { zoomControl: true, scrollWheelZoom: false });
      mapInstanceRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
        maxZoom: 19,
      }).addTo(map);

      const [shopCoords, customerCoords] = await Promise.all([
        geocodeAddress(shopAddress),
        geocodeAddress(customerAddress),
      ]);

      const points = [];

      if (shopCoords) {
        L.marker([shopCoords.lat, shopCoords.lon], { icon: makeIcon(L, "#ff9900") })
          .addTo(map)
          .bindPopup(`<b>🏪 ${shopName || "Shop"}</b><br/>${shopAddress}`)
          .openPopup();
        points.push([shopCoords.lat, shopCoords.lon]);
      }

      if (customerCoords) {
        L.marker([customerCoords.lat, customerCoords.lon], { icon: makeIcon(L, "#e74c3c") })
          .addTo(map)
          .bindPopup(`<b>📍 Delivery Address</b><br/>${customerAddress}`);
        points.push([customerCoords.lat, customerCoords.lon]);
      }

      if (points.length === 2) {
        // Draw a dashed line between shop and customer
        L.polyline(points, { color: "#ff9900", weight: 3, dashArray: "8 6", opacity: 0.8 }).addTo(map);
        map.fitBounds(points, { padding: [40, 40] });
      } else if (points.length === 1) {
        map.setView(points[0], 14);
      } else {
        // Fallback: center on India
        map.setView([20.5937, 78.9629], 5);
        setStatus("error");
        return;
      }

      setStatus("ready");
    }

    initMap();
    return () => {
      if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; }
    };
  }, [shopAddress, customerAddress, shopName]);

  const googleMapsUrl = shopAddress && customerAddress
    ? `https://www.google.com/maps/dir/${encodeURIComponent(shopAddress)}/${encodeURIComponent(customerAddress)}`
    : null;

  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 mb-3">
      {/* Header */}
      <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
        <div>
          <p className="text-xs font-black text-gray-800">
            🗺️ {mode === "delivery" ? "Delivery Route" : "Your Delivery Route"}
          </p>
          <p className="text-[10px] text-gray-400 mt-0.5">
            <span className="text-orange-500 font-bold">🟠 {shopName || "Shop"}</span>
            {" → "}
            <span className="text-red-500 font-bold">🔴 Delivery Address</span>
          </p>
        </div>
        {googleMapsUrl && (
          <a href={googleMapsUrl} target="_blank" rel="noreferrer"
            className="flex items-center gap-1 text-[11px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1.5 rounded-full hover:bg-blue-100 transition-all">
            <ExternalLink size={11} /> Open in Maps
          </a>
        )}
      </div>

      {/* Map container */}
      <div className="relative">
        <div ref={mapRef} style={{ height: "220px", width: "100%" }} />
        {status === "loading" && (
          <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-gray-500">Loading map...</span>
            </div>
          </div>
        )}
        {status === "error" && (
          <div className="absolute inset-0 bg-gray-50 flex items-center justify-center">
            <p className="text-xs text-gray-400">Could not load map for this address</p>
          </div>
        )}
      </div>
    </div>
  );
}
