"use client";

import { useState } from "react";

const navSections = [
  {
    title: "OVERVIEW",
    items: [{ label: "Dashboard", icon: "📊", active: false }],
  },
  {
    title: "COMMODITIES",
    items: [
      { label: "Natural Gas", icon: "🔥", active: true },
      { label: "Crude Oil", icon: "🛢️", active: false },
      { label: "Gold", icon: "🥇", active: false },
    ],
  },
  {
    title: "STOCKS",
    items: [
      { label: "Watchlist", icon: "👁️", active: false },
      { label: "Portfolio", icon: "💼", active: false },
    ],
  },
];

export default function Sidebar() {
  const [collapsed] = useState(false);

  return (
    <aside
      className="h-screen sticky top-0 flex flex-col border-r border-[#1a1d26] overflow-y-auto fin-scrollbar"
      style={{
        width: collapsed ? 64 : 210,
        background: "#0a0d14",
      }}
    >
      {/* Logo */}
      <div className="px-5 pt-6 pb-4">
        <h1
          className="text-xl font-extrabold italic"
          style={{ fontFamily: "'Outfit', sans-serif", color: "#e8872a" }}
        >
          FinHelper
        </h1>
        <p className="text-[10px] tracking-[0.2em] text-[#5a5e6b] mt-0.5 font-medium">
          MARKET INTELLIGENCE
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-5 mt-2">
        {navSections.map((section) => (
          <div key={section.title}>
            <p className="text-[10px] tracking-[0.15em] text-[#44475a] font-semibold px-2 mb-2">
              {section.title}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => (
                <li key={item.label}>
                  <button
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-colors ${
                      item.active
                        ? "bg-[#e8872a]/10 text-[#e8872a] font-medium"
                        : "text-[#7a7e8f] hover:bg-[#13161e] hover:text-[#b0b3c0]"
                    }`}
                  >
                    <span className="text-sm">{item.icon}</span>
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="px-3 pb-4 space-y-3">
        {/* Settings */}
        <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-[#7a7e8f] hover:bg-[#13161e] hover:text-[#b0b3c0] transition-colors">
          <span className="text-sm">⚙️</span>
          Settings
        </button>

        {/* Live indicator */}
        <div className="flex items-center gap-2 px-3 py-2">
          <span className="relative flex h-2 w-2">
            <span className="live-pulse absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
          <span className="text-[10px] tracking-[0.15em] text-[#5a5e6b] font-medium">
            LIVE MARKET DATA
          </span>
        </div>
      </div>
    </aside>
  );
}
