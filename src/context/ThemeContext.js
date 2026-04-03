import { createContext, useContext, useState } from "react";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(() => localStorage.getItem("apniDukaanTheme") === "dark");

  const toggle = () => {
    setDark((d) => {
      localStorage.setItem("apniDukaanTheme", !d ? "dark" : "light");
      return !d;
    });
  };

  const theme = {
    dark,
    toggle,
    bg: dark ? "#1a1a2e" : "#f0f2f5",
    card: dark ? "#16213e" : "#ffffff",
    text: dark ? "#e0e0e0" : "#232f3e",
    subText: dark ? "#aaa" : "#888",
    border: dark ? "#2a2a4a" : "#eee",
    input: dark ? "#0f3460" : "#fff",
    navbar: dark ? "#0f0f1a" : "linear-gradient(90deg, #1a252f, #232f3e)",
    section: dark ? "#1a1a2e" : "#f0f2f5",
  };

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
