"use client";

import { useFinanceData } from "@/hooks/useFinanceData";

export default function PriceRangeBar() {
  const { data, loading } = useFinanceData();

  if (loading || !data) {
    return <div className="fin-shimmer h-28 rounded-xl" />;
  }

  const { price, high52W, low52W } = data;
  const range = high52W - low52W;
  const position = range === 0 ? 50 : ((price - low52W) / range) * 100;
  const clampedPos = Math.max(2, Math.min(98, position));

  return (
    <div className="bg-[#171a21] border border-[#22252e] rounded-xl p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[13px] font-semibold text-[#b0b3c0]">
          52-Week Price Range
        </h3>
        <span className="px-2 py-0.5 bg-[#1c1f28] border border-[#22252e] rounded text-[10px] text-[#5a5e6b] font-mono tracking-wider">
          NYMEX FUTURES
        </span>
      </div>

      {/* Range bar */}
      <div className="relative mt-2">
        {/* Track */}
        <div
          className="h-2 rounded-full"
          style={{
            background:
              "linear-gradient(90deg, #e8872a 0%, #f5c542 100%)",
          }}
        />

        {/* Thumb */}
        <div
          className="absolute top-1/2 -translate-y-1/2"
          style={{ left: `${clampedPos}%`, transform: `translateX(-50%) translateY(-50%)` }}
        >
          <div className="w-4 h-4 rounded-full bg-white border-2 border-[#0d1017] shadow-lg shadow-black/30" />
        </div>
      </div>

      {/* Labels */}
      <div className="flex justify-between mt-3 text-[12px]">
        <div>
          <span className="text-[#5a5e6b]">52W Low </span>
          <span
            className="text-red-400 font-semibold"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            {low52W.toFixed(3)}
          </span>
        </div>
        <div>
          <span className="text-[#5a5e6b]">Current </span>
          <span
            className="text-white font-semibold"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            {price.toFixed(3)}
          </span>
        </div>
        <div>
          <span className="text-[#5a5e6b]">52W High </span>
          <span
            className="text-green-400 font-semibold"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            {high52W.toFixed(3)}
          </span>
        </div>
      </div>
    </div>
  );
}
