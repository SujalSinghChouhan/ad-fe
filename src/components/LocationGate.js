import { useState } from "react";
import { MapPin, Navigation, Map, X, Loader } from "lucide-react";
import { useLocation2 } from "../context/LocationContext";
import MapPicker from "./MapPicker";

export default function LocationGate() {
  const { location, saveLocation } = useLocation2();
  const [detecting, setDetecting] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [error, setError] = useState("");

  // Already set — don't show
  if (location) return null;

  const detectLocation = () => {
    setError("");
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        try {
          const res = await fetch(`/api/geocode/reverse?lat=${lat}&lon=${lon}`);
          const data = await res.json();
          const addr = data.address || {};
          const city = addr.city || addr.town || addr.village || addr.county || "";
          saveLocation({ lat, lon, address: data.display_name || `${lat},${lon}`, city });
        } catch {
          saveLocation({ lat, lon, address: `${lat.toFixed(4)}, ${lon.toFixed(4)}`, city: "" });
        } finally {
          setDetecting(false);
        }
      },
      () => {
        setDetecting(false);
        setError("Could not detect location. Please allow location access or pick manually.");
      },
      { timeout: 10000 }
    );
  };

  const handleMapSelect = async (address) => {
    // Forward geocode the picked address to get lat/lon
    try {
      const res = await fetch(`/api/geocode/forward?q=${encodeURIComponent(address)}`);
      const data = await res.json();
      const addrRes = await fetch(`/api/geocode/reverse?lat=${data.lat}&lon=${data.lon}`);
      const addrData = await addrRes.json();
      const addr = addrData.address || {};
      const city = addr.city || addr.town || addr.village || addr.county || "";
      saveLocation({ lat: data.lat, lon: data.lon, address, city });
    } catch {
      saveLocation({ lat: null, lon: null, address, city: "" });
    }
  };

  if (showMap) {
    return <MapPicker onSelect={handleMapSelect} onClose={() => setShowMap(false)} />;
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden">
        {/* Top illustration */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-400 px-6 pt-8 pb-6 text-center">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin size={36} className="text-white" />
          </div>
          <h2 className="text-white text-xl font-black">Where should we deliver?</h2>
          <p className="text-white/80 text-sm mt-1">We'll show shops & products near you</p>
        </div>

        <div className="p-6 space-y-3">
          {error && (
            <div className="bg-red-50 text-red-600 text-xs font-semibold px-4 py-2.5 rounded-xl">
              {error}
            </div>
          )}

          {/* Auto detect */}
          <button onClick={detectLocation} disabled={detecting}
            className="w-full flex items-center gap-3 bg-orange-500 text-white font-bold py-3.5 px-5 rounded-2xl active:scale-95 transition-all disabled:opacity-60">
            {detecting
              ? <Loader size={18} className="animate-spin flex-shrink-0" />
              : <Navigation size={18} className="flex-shrink-0" />}
            <span>{detecting ? "Detecting your location..." : "Use My Current Location"}</span>
          </button>

          {/* Pick on map */}
          <button onClick={() => setShowMap(true)}
            className="w-full flex items-center gap-3 bg-gray-900 text-white font-bold py-3.5 px-5 rounded-2xl active:scale-95 transition-all">
            <Map size={18} className="flex-shrink-0" />
            <span>Pick Location on Map</span>
          </button>

          {/* Skip */}
          <button onClick={() => saveLocation({ lat: null, lon: null, address: "", city: "", skipped: true })}
            className="w-full text-gray-400 text-sm font-semibold py-2 hover:text-gray-600 transition-colors flex items-center justify-center gap-1">
            <X size={13} /> Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}
