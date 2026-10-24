import { useState, useEffect } from 'react';

export default function EnergyWaveVisualizer() {
  const [bars, setBars] = useState([40, 65, 80, 50, 95, 70, 85, 45, 60, 90, 75, 55, 85, 65, 50]);

  useEffect(() => {
    const interval = setInterval(() => {
      setBars((prev) =>
        prev.map(() => Math.floor(Math.random() * 65 + 35))
      );
    }, 450);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-end gap-1.5 h-12 px-3 py-1 bg-black/40 rounded-xl border border-emerald-500/20 backdrop-blur-md">
      {bars.map((height, i) => (
        <div
          key={i}
          className="w-1.5 rounded-full transition-all duration-300"
          style={{
            height: `${height}%`,
            background: `linear-gradient(to top, #10B981, #00FF87)`,
            boxShadow: height > 70 ? '0 0 8px #00FF87' : 'none',
          }}
        />
      ))}
    </div>
  );
}
