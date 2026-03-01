"use client";

import { useFinanceData } from "@/hooks/useFinanceData";

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  color?: string;
  delay: number;
}

function StatCard({ label, value, sub, color, delay }: StatCardProps) {
  return (
    <div
      className={`fin-fade-up d${delay} bg-[#171a21] border border-[#22252e] rounded-xl p-4`}
    >
      <p className="text-[11px] text-[#5a5e6b] font-medium tracking-wide mb-2">
        {label}
      </p>
      <p
        className="font-bold"
        style={{
          fontSize: 23,
          fontFamily: "'JetBrains Mono', monospace",
          color: color || "#e1e4ea",
        }}
      >
        {value}
      </p>
      {sub && (
        <p className="text-[11px] text-[#5a5e6b] mt-1">{sub}</p>
      )}
    </div>
  );
}

function formatVolume(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return v.toString();
}

export default function StatCards() {
  const { data, loading } = useFinanceData();

  if (loading || !data) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="fin-shimmer h-24 rounded-xl" />
        ))}
      </div>
    );
  }

  const cards: Omit<StatCardProps, "delay">[] = [
    { label: "OPEN", value: data.open.toFixed(3) },
    { label: "DAY HIGH", value: data.dayHigh.toFixed(3), color: "#4ade80" },
    { label: "DAY LOW", value: data.dayLow.toFixed(3), color: "#f87171" },
    { label: "VOLUME", value: formatVolume(data.volume) },
    {
      label: "52W HIGH",
      value: data.high52W.toFixed(3),
      color: "#4ade80",
      sub: data.high52WDate,
    },
    {
      label: "52W LOW",
      value: data.low52W.toFixed(3),
      color: "#f87171",
      sub: data.low52WDate,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((card, i) => (
        <StatCard key={card.label} {...card} delay={i + 1} />
      ))}
    </div>
  );
}
