import { useEffect, useRef, useState } from "react";
import { MapPin, X, Check, Loader } from "lucide-react";

// Fix Leaflet default marker icon (webpack issue)
function fixLeafletIcons(L) {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
}

export default function MapPicker({ onSelect, onClose, initialAddress }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const [pickedAddress, setPickedAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    let L;
    async function initMap() {
      L = await import("leaflet");
      fixLeafletIcons(L);

      if (mapInstanceRef.current) return;

      // Default center: India
      const defaultCenter = [20.5937, 78.9629];
      const map = L.map(mapRef.current, { zoomControl: true }).setView(defaultCenter, 5);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;

      // If initial address exists, geocode it and center map
      if (initialAddress) {
        try {
          const res = await fetch(`/api/geocode/forward?q=${encodeURIComponent(initialAddress)}`);
          const data = await res.json();
          if (data.lat && data.lon) {
            map.setView([data.lat, data.lon], 15);
            markerRef.current = L.marker([data.lat, data.lon]).addTo(map);
            setPickedAddress(initialAddress);
          }
        } catch {}
      }

      // Click to pick location
      map.on("click", async (e) => {
        const { lat, lng } = e.latlng;
        setLoading(true);

        if (markerRef.current) markerRef.current.setLatLng([lat, lng]);
        else markerRef.current = L.marker([lat, lng]).addTo(map);

        try {
          const res = await fetch(`/api/geocode/reverse?lat=${lat}&lon=${lng}`);
          const data = await res.json();
          setPickedAddress(data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        } catch {
          setPickedAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        } finally {
          setLoading(false);
        }
      });
    }

    initMap();
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const detectMyLocation = () => {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        const L = await import("leaflet");
        fixLeafletIcons(L);
        const map = mapInstanceRef.current;
        if (!map) return;

        map.setView([lat, lng], 16);
        if (markerRef.current) markerRef.current.setLatLng([lat, lng]);
        else markerRef.current = L.marker([lat, lng]).addTo(map);

        setLoading(true);
        try {
          const res = await fetch(`/api/geocode/reverse?lat=${lat}&lon=${lng}`);
          const data = await res.json();
          setPickedAddress(data.display_name || `${lat}, ${lng}`);
        } catch {
          setPickedAddress(`${lat}, ${lng}`);
        } finally {
          setLoading(false);
          setLocating(false);
        }
      },
      () => setLocating(false)
    );
  };

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white shadow-sm flex-shrink-0">
        <div className="flex items-center gap-2">
          <MapPin size={18} className="text-orange-500" />
          <span className="font-black text-gray-900 text-base">Pick Delivery Location</span>
        </div>
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200">
          <X size={16} className="text-gray-600" />
        </button>
      </div>

      {/* Tip */}
      <div className="px-4 py-2 bg-orange-50 border-b border-orange-100 flex-shrink-0">
        <p className="text-xs text-orange-700 font-medium">📍 Tap anywhere on the map to set your delivery address</p>
      </div>

      {/* Map */}
      <div ref={mapRef} className="flex-1 w-full" style={{ minHeight: 0 }} />

      {/* Bottom Panel */}
      <div className="flex-shrink-0 bg-white shadow-[0_-4px_24px_rgba(0,0,0,0.08)] p-4 space-y-3">
        {/* Detect location button */}
        <button onClick={detectMyLocation} disabled={locating}
          className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white font-bold py-2.5 rounded-full text-sm active:scale-95 transition-all disabled:opacity-60">
          {locating ? <Loader size={14} className="animate-spin" /> : <MapPin size={14} />}
          {locating ? "Detecting..." : "📍 Use My Current Location"}
        </button>

        {/* Picked address display */}
        <div className="bg-gray-50 rounded-2xl px-4 py-3 min-h-[52px] flex items-center gap-2">
          {loading ? (
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <Loader size={14} className="animate-spin" /> Fetching address...
            </div>
          ) : pickedAddress ? (
            <p className="text-sm text-gray-700 font-medium line-clamp-2">{pickedAddress}</p>
          ) : (
            <p className="text-sm text-gray-400">No location selected yet</p>
          )}
        </div>

        {/* Confirm button */}
        <button
          onClick={() => { if (pickedAddress) { onSelect(pickedAddress); onClose(); } }}
          disabled={!pickedAddress || loading}
          className="w-full flex items-center justify-center gap-2 bg-orange-500 text-white font-black py-3 rounded-full text-sm active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
          <Check size={16} /> Confirm This Address
        </button>
      </div>
    </div>
  );
}
