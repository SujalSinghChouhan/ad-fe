import { createContext, useContext, useState } from "react";

const LoyaltyContext = createContext();

export function LoyaltyProvider({ children }) {
  const [points, setPoints] = useState(() => Number(localStorage.getItem("apniDukaanPoints") || 0));

  const addPoints = (amount) => {
    const earned = Math.floor(amount / 10);
    setPoints(prev => {
      const updated = prev + earned;
      localStorage.setItem("apniDukaanPoints", updated);
      return updated;
    });
    return earned;
  };

  const redeemPoints = (pts) => {
    setPoints(prev => {
      const updated = Math.max(0, prev - pts);
      localStorage.setItem("apniDukaanPoints", updated);
      return updated;
    });
  };

  const pointsValue = Math.floor(points / 10);

  return (
    <LoyaltyContext.Provider value={{ points, addPoints, redeemPoints, pointsValue }}>
      {children}
    </LoyaltyContext.Provider>
  );
}

export const useLoyalty = () => useContext(LoyaltyContext);
