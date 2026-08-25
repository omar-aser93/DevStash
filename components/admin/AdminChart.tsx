"use client";

export function AdminChart() {
  // Placeholder – you can replace with Recharts or any chart library
  return (
    <div className="flex items-end gap-2 h-40">
      {[40, 65, 80, 55, 90, 70, 100].map((height, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full max-w-10 rounded-sm bg-blue-500/60 transition-all hover:bg-blue-400"
            style={{ height: `${height}%` }}
          />
          <span className="text-[10px] text-muted-foreground">Day {i+1}</span>
        </div>
      ))}
    </div>
  );
}