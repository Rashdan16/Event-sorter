"use client";

import { useFinanceData } from "@/hooks/useFinanceData";
import { generateAISignal } from "@/lib/finance/ai-signal";
import { Signal, Recommendation } from "@/lib/finance/types";
import { useMemo } from "react";

const signalColors: Record<Signal, { bg: string; text: string }> = {
  BULLISH: { bg: "bg-green-500/15", text: "text-green-400" },
  BEARISH: { bg: "bg-red-500/15", text: "text-red-400" },
  NEUTRAL: { bg: "bg-yellow-500/15", text: "text-yellow-400" },
};

const recColors: Record<Recommendation, { bg: string; text: string; border: string }> = {
  BUY: { bg: "bg-green-500/10", text: "text-green-400", border: "border-green-500/30" },
  SELL: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/30" },
  HOLD: { bg: "bg-yellow-500/10", text: "text-yellow-400", border: "border-yellow-500/30" },
};

export default function AISignalPanel() {
  const { data, loading } = useFinanceData();

  const signal = useMemo(() => {
    if (!data || data.historical.length < 35) return null;
    return generateAISignal(data.historical);
  }, [data]);

  return (
    <aside
      className="min-[1380px]:h-screen min-[1380px]:sticky min-[1380px]:top-0 overflow-y-auto border-l border-[#1a1d26] fin-scrollbar"
      style={{ width: "100%", maxWidth: 285, background: "#0a0d14" }}
    >
      <div className="p-5 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#e8872a]" />
          <h2
            className="text-sm font-bold text-white"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            AI Signal
          </h2>
          <span className="ml-auto px-1.5 py-0.5 bg-[#e8872a]/15 text-[#e8872a] text-[9px] font-bold tracking-wider rounded">
            BETA
          </span>
        </div>

        {loading || !signal ? (
          <div className="space-y-3">
            <div className="fin-shimmer h-20 rounded-xl" />
            <div className="fin-shimmer h-12 rounded-lg" />
            <div className="fin-shimmer h-32 rounded-lg" />
          </div>
        ) : (
          <>
            {/* Recommendation */}
            <div
              className={`${recColors[signal.recommendation].bg} border ${recColors[signal.recommendation].border} rounded-xl p-4 text-center`}
            >
              <p className="text-[10px] text-[#5a5e6b] tracking-wider mb-1">
                RECOMMENDATION
              </p>
              <p
                className={`text-2xl font-extrabold ${recColors[signal.recommendation].text}`}
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                {signal.recommendation}
              </p>
            </div>

            {/* Description */}
            <p className="text-[12px] text-[#7a7e8f] leading-relaxed">
              {signal.description}
            </p>

            {/* Confidence */}
            <div>
              <div className="flex justify-between text-[11px] mb-1.5">
                <span className="text-[#5a5e6b]">Confidence</span>
                <span
                  className="text-[#e8872a] font-semibold"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {signal.confidence}%
                </span>
              </div>
              <div className="h-1.5 bg-[#1c1f28] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${signal.confidence}%`,
                    background:
                      "linear-gradient(90deg, #e8872a, #f5c542)",
                  }}
                />
              </div>
            </div>

            {/* Indicators */}
            <div>
              <p className="text-[10px] text-[#44475a] tracking-wider font-semibold mb-3">
                TECHNICAL INDICATORS
              </p>
              <div className="space-y-2">
                {signal.indicators.map((ind) => (
                  <div
                    key={ind.name}
                    className="flex items-center justify-between bg-[#13161e] rounded-lg px-3 py-2"
                  >
                    <div>
                      <p className="text-[12px] text-[#b0b3c0] font-medium">
                        {ind.name}
                      </p>
                      <p
                        className="text-[11px] text-[#5a5e6b]"
                        style={{ fontFamily: "'JetBrains Mono', monospace" }}
                      >
                        {ind.value}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${signalColors[ind.signal].bg} ${signalColors[ind.signal].text}`}
                    >
                      {ind.signal}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Support & Resistance */}
            <div>
              <p className="text-[10px] text-[#44475a] tracking-wider font-semibold mb-3">
                SUPPORT & RESISTANCE
              </p>
              <div className="bg-[#13161e] rounded-lg overflow-hidden">
                {[
                  { label: "R2", value: signal.pivots.r2, color: "text-green-400" },
                  { label: "R1", value: signal.pivots.r1, color: "text-green-400" },
                  { label: "Pivot", value: signal.pivots.pivot, color: "text-[#e8872a]" },
                  { label: "S1", value: signal.pivots.s1, color: "text-red-400" },
                  { label: "S2", value: signal.pivots.s2, color: "text-red-400" },
                ].map((row, i) => (
                  <div
                    key={row.label}
                    className={`flex justify-between px-3 py-2 ${
                      i < 4 ? "border-b border-[#1a1d26]" : ""
                    }`}
                  >
                    <span className="text-[11px] text-[#5a5e6b]">
                      {row.label}
                    </span>
                    <span
                      className={`text-[12px] font-semibold ${row.color}`}
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      {row.value.toFixed(3)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
