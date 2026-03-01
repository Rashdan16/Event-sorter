"use client";

import Header from "@/components/financial-helper/Header";
import StatCards from "@/components/financial-helper/StatCards";
import PriceRangeBar from "@/components/financial-helper/PriceRangeBar";
import TradingViewChart from "@/components/financial-helper/TradingViewChart";

export default function FinancialHelperPage() {
  return (
    <div className="p-6 space-y-6 max-w-[1200px]">
      {/* Header */}
      <div className="fin-fade-up">
        <Header />
      </div>

      {/* Stat Cards */}
      <div className="fin-fade-up d1">
        <StatCards />
      </div>

      {/* Price Range Bar */}
      <div className="fin-fade-up d2">
        <PriceRangeBar />
      </div>

      {/* TradingView Chart */}
      <div className="fin-fade-up d3">
        <TradingViewChart />
      </div>
    </div>
  );
}
