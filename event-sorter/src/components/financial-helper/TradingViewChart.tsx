"use client";

import { useRef, useEffect, memo } from "react";

function TradingViewChartInner() {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptInjected = useRef(false);

  useEffect(() => {
    if (scriptInjected.current || !containerRef.current) return;
    scriptInjected.current = true;

    const container = containerRef.current;

    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: "CAPITALCOM:NATURALGAS",
      interval: "30",
      timezone: "Etc/UTC",
      theme: "dark",
      style: "1",
      locale: "en",
      backgroundColor: "rgba(23, 26, 33, 1)",
      gridColor: "rgba(42, 46, 57, 0.3)",
      hide_top_toolbar: false,
      hide_legend: false,
      allow_symbol_change: false,
      save_image: false,
      calendar: false,
      studies: ["RSI@tv-basicstudies", "MACD@tv-basicstudies"],
      support_host: "https://www.tradingview.com",
    });

    container.appendChild(script);

    return () => {
      // Cleanup on unmount
      if (container) {
        container.innerHTML = "";
      }
      scriptInjected.current = false;
    };
  }, []);

  return (
    <div className="bg-[#171a21] border border-[#22252e] rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <h3 className="text-[13px] font-semibold text-[#b0b3c0]">
          Price Chart
        </h3>
        <span className="text-[10px] text-[#5a5e6b] font-mono">
          CAPITALCOM:NATURALGAS · 30min
        </span>
      </div>
      <div
        ref={containerRef}
        className="tradingview-widget-container"
        style={{ height: 750 }}
      />
    </div>
  );
}

export default memo(TradingViewChartInner);
