"use client";

import { useFinanceData } from "@/hooks/useFinanceData";

export default function Header() {
  const { data, loading } = useFinanceData();

  const secondsAgo = data
    ? Math.round((Date.now() - data.lastUpdated) / 1000)
    : 0;

  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
      {/* Left side */}
      <div>
        <div className="flex items-center gap-2 text-[12px] text-[#5a5e6b] mb-2">
          <span>Financial Helper</span>
          <span>›</span>
          <span>Commodities</span>
          <span>›</span>
          <span className="text-[#b0b3c0]">Natural Gas</span>
        </div>
        <div className="flex items-center gap-3">
          <h1
            className="text-2xl font-bold text-white"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            Natural Gas
          </h1>
          <span className="px-2 py-0.5 bg-[#171a21] border border-[#22252e] rounded text-[11px] text-[#7a7e8f] font-mono">
            NGAS · USD/MMBtu
          </span>
        </div>
      </div>

      {/* Right side - price display */}
      <div className="flex items-end gap-3">
        {loading || !data ? (
          <div className="space-y-2">
            <div className="fin-shimmer h-10 w-32" />
            <div className="fin-shimmer h-5 w-24" />
          </div>
        ) : (
          <>
            <span
              className="text-white font-bold leading-none"
              style={{
                fontSize: 42,
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {data.price.toFixed(3)}
            </span>
            <div className="flex flex-col items-end pb-1">
              <span
                className={`px-2 py-0.5 rounded text-[13px] font-semibold font-mono ${
                  data.change >= 0
                    ? "bg-green-500/15 text-green-400"
                    : "bg-red-500/15 text-red-400"
                }`}
              >
                {data.change >= 0 ? "+" : ""}
                {data.change.toFixed(3)} ({data.changePercent.toFixed(2)}%)
              </span>
              <span className="text-[11px] text-[#5a5e6b] mt-1">
                Updated {secondsAgo}s ago
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
