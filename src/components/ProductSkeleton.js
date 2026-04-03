export default function ProductSkeleton() {
  const shimmer = {
    background: "linear-gradient(90deg, var(--surface-low) 25%, var(--surface-lowest) 50%, var(--surface-low) 75%)",
    backgroundSize: "200% 100%",
    animation: "shimmer 1.5s infinite",
  };
  return (
    <div style={{ background: "var(--surface-lowest)", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-ambient)", overflow: "hidden", width: "240px" }}>
      <div style={{ ...shimmer, height: "180px", borderRadius: "var(--radius-sm) var(--radius-sm) 0 0" }} />
      <div style={{ padding: "20px 16px 16px", display: "flex", flexDirection: "column", gap: "10px" }}>
        <div style={{ ...shimmer, height: "16px", borderRadius: "var(--radius-full)", width: "75%" }} />
        <div style={{ ...shimmer, height: "13px", borderRadius: "var(--radius-full)", width: "55%" }} />
        <div style={{ ...shimmer, height: "13px", borderRadius: "var(--radius-full)", width: "40%" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" }}>
          <div style={{ ...shimmer, height: "20px", borderRadius: "var(--radius-full)", width: "30%" }} />
          <div style={{ ...shimmer, width: "80px", height: "34px", borderRadius: "var(--radius-full)" }} />
        </div>
      </div>
    </div>
  );
}

