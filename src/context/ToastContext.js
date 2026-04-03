import { useState, createContext, useContext, useCallback } from "react";

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "info", duration = 4000) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), duration);
  }, []);

  const removeToast = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const icons = { success: "✅", error: "❌", warning: "⚠️", info: "ℹ️", order: "📦", delivery: "🛵" };
  const colors = {
    success:  { bg: "#e8f5e9", border: "#27ae60", text: "#2e7d32" },
    error:    { bg: "#ffebee", border: "#e74c3c", text: "#c62828" },
    warning:  { bg: "#fff3e0", border: "#ff9900", text: "#e65100" },
    info:     { bg: "#e3f2fd", border: "#1565c0", text: "#1565c0" },
    order:    { bg: "#fff8f0", border: "#ff9900", text: "#232f3e" },
    delivery: { bg: "#f3e5f5", border: "#6a1b9a", text: "#6a1b9a" },
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {/* Toast Container */}
      <div style={{ position: "fixed", top: "80px", right: "20px", zIndex: 99999, display: "flex", flexDirection: "column", gap: "10px", maxWidth: "340px" }}>
        {toasts.map((toast) => {
          const c = colors[toast.type] || colors.info;
          return (
            <div key={toast.id} style={{ background: c.bg, border: `1px solid ${c.border}`, borderLeft: `4px solid ${c.border}`, borderRadius: "10px", padding: "14px 16px", boxShadow: "0 4px 16px rgba(0,0,0,0.12)", display: "flex", alignItems: "flex-start", gap: "10px", animation: "slideIn 0.3s ease" }}>
              <span style={{ fontSize: "20px", flexShrink: 0 }}>{icons[toast.type] || icons.info}</span>
              <p style={{ margin: 0, fontSize: "14px", color: c.text, lineHeight: "1.5", flex: 1 }}>{toast.message}</p>
              <button onClick={() => removeToast(toast.id)} style={{ background: "none", border: "none", cursor: "pointer", color: c.text, fontSize: "16px", padding: 0, flexShrink: 0 }}>✕</button>
            </div>
          );
        })}
      </div>
      <style>{`@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
