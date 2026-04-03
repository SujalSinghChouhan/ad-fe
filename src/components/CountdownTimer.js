import { useState, useEffect } from "react";

export default function CountdownTimer({ endTime, label = "Deal ends in" }) {
  const [time, setTime] = useState({ h: 0, m: 0, s: 0 });

  useEffect(() => {
    const calc = () => {
      const diff = Math.max(0, endTime - Date.now());
      setTime({
        h: Math.floor(diff / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    };
    calc();
    const t = setInterval(calc, 1000);
    return () => clearInterval(t);
  }, [endTime]);

  const pad = (n) => String(n).padStart(2, "0");

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-bold text-gray-500">{label}:</span>
      <div className="flex items-center gap-1">
        {[time.h, time.m, time.s].map((val, i) => (
          <span key={i} className="flex items-center gap-1">
            <span className="bg-gray-900 text-white text-xs font-black px-2 py-1 rounded-lg min-w-[28px] text-center tabular-nums">
              {pad(val)}
            </span>
            {i < 2 && <span className="text-gray-900 font-black text-sm">:</span>}
          </span>
        ))}
      </div>
    </div>
  );
}
