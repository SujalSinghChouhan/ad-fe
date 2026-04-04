import { createContext, useContext, useState, useCallback } from "react";

const LocationContext = createContext();

export function LocationProvider({ children }) {
  const [location, setLocationState] = useState(() => {
    try {
      const saved = localStorage.getItem("apniDukaanLocation");
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  // location shape: { lat, lon, address, city }
  const saveLocation = useCallback((loc) => {
    setLocationState(loc);
    localStorage.setItem("apniDukaanLocation", JSON.stringify(loc));
  }, []);

  const clearLocation = useCallback(() => {
    setLocationState(null);
    localStorage.removeItem("apniDukaanLocation");
  }, []);

  return (
    <LocationContext.Provider value={{ location, saveLocation, clearLocation }}>
      {children}
    </LocationContext.Provider>
  );
}

export const useLocation2 = () => useContext(LocationContext);
