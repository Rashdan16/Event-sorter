"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  ReactNode,
  createElement,
} from "react";
import { FinanceData, OHLCV } from "@/lib/finance/types";

interface FinanceContextValue {
  data: FinanceData | null;
  loading: boolean;
  error: string | null;
}

const FinanceContext = createContext<FinanceContextValue>({
  data: null,
  loading: true,
  error: null,
});

export function useFinanceData() {
  return useContext(FinanceContext);
}

function find52WeekExtremes(historical: OHLCV[]) {
  let high52W = -Infinity;
  let low52W = Infinity;
  let high52WDate = "";
  let low52WDate = "";

  for (const bar of historical) {
    if (bar.high > high52W) {
      high52W = bar.high;
      high52WDate = new Date(bar.date * 1000).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });
    }
    if (bar.low < low52W && bar.low > 0) {
      low52W = bar.low;
      low52WDate = new Date(bar.date * 1000).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });
    }
  }

  return { high52W, low52W, high52WDate, low52WDate };
}

export function FinanceDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<FinanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/finance?symbol=NG=F&range=1y&interval=1d");
      if (!res.ok) {
        throw new Error(`API returned ${res.status}`);
      }
      const json = await res.json();

      if (json.error) {
        throw new Error(json.error);
      }

      const historical: OHLCV[] = json.historical || [];
      const extremes = find52WeekExtremes(historical);

      const price = json.price ?? 0;
      const previousClose = json.previousClose ?? 0;
      const change = price - previousClose;
      const changePercent = previousClose ? (change / previousClose) * 100 : 0;

      setData({
        symbol: json.symbol || "NG=F",
        shortName: json.shortName || "Natural Gas",
        price,
        previousClose,
        change,
        changePercent,
        open: json.open ?? price,
        dayHigh: json.dayHigh ?? price,
        dayLow: json.dayLow ?? price,
        volume: json.volume ?? 0,
        high52W: extremes.high52W,
        low52W: extremes.low52W,
        high52WDate: extremes.high52WDate,
        low52WDate: extremes.low52WDate,
        historical,
        lastUpdated: Date.now(),
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    intervalRef.current = setInterval(fetchData, 10_000);

    const handleVisibility = () => {
      if (document.hidden) {
        if (intervalRef.current) clearInterval(intervalRef.current);
      } else {
        fetchData();
        intervalRef.current = setInterval(fetchData, 10_000);
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [fetchData]);

  return createElement(
    FinanceContext.Provider,
    { value: { data, loading, error } },
    children
  );
}
