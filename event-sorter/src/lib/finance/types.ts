export interface OHLCV {
  date: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface FinanceData {
  symbol: string;
  shortName: string;
  price: number;
  previousClose: number;
  change: number;
  changePercent: number;
  open: number;
  dayHigh: number;
  dayLow: number;
  volume: number;
  high52W: number;
  low52W: number;
  high52WDate: string;
  low52WDate: string;
  historical: OHLCV[];
  lastUpdated: number;
}

export type Signal = "BULLISH" | "BEARISH" | "NEUTRAL";
export type Recommendation = "BUY" | "HOLD" | "SELL";

export interface IndicatorResult {
  name: string;
  value: string;
  signal: Signal;
}

export interface PivotPoints {
  r2: number;
  r1: number;
  pivot: number;
  s1: number;
  s2: number;
}

export interface AISignal {
  recommendation: Recommendation;
  confidence: number;
  description: string;
  indicators: IndicatorResult[];
  pivots: PivotPoints;
}
