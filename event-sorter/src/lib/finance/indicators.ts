import { OHLCV, IndicatorResult, PivotPoints, Signal } from "./types";

function ema(data: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const result: number[] = [];
  let prev = data[0];
  result.push(prev);
  for (let i = 1; i < data.length; i++) {
    prev = data[i] * k + prev * (1 - k);
    result.push(prev);
  }
  return result;
}

export function calcRSI(closes: number[], period = 14): IndicatorResult {
  if (closes.length < period + 1) {
    return { name: "RSI (14)", value: "N/A", signal: "NEUTRAL" };
  }

  let avgGain = 0;
  let avgLoss = 0;

  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) avgGain += diff;
    else avgLoss += Math.abs(diff);
  }
  avgGain /= period;
  avgLoss /= period;

  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    avgGain = (avgGain * (period - 1) + (diff > 0 ? diff : 0)) / period;
    avgLoss = (avgLoss * (period - 1) + (diff < 0 ? Math.abs(diff) : 0)) / period;
  }

  const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  const rsi = 100 - 100 / (1 + rs);

  let signal: Signal = "NEUTRAL";
  if (rsi < 30) signal = "BULLISH";
  else if (rsi > 70) signal = "BEARISH";

  return { name: "RSI (14)", value: rsi.toFixed(1), signal };
}

export function calcMACD(closes: number[]): IndicatorResult {
  if (closes.length < 35) {
    return { name: "MACD", value: "N/A", signal: "NEUTRAL" };
  }

  const ema12 = ema(closes, 12);
  const ema26 = ema(closes, 26);
  const macdLine = ema12.map((v, i) => v - ema26[i]);
  const signalLine = ema(macdLine.slice(26), 9);

  const macdVal = macdLine[macdLine.length - 1];
  const signalVal = signalLine[signalLine.length - 1];

  const signal: Signal = macdVal > signalVal ? "BULLISH" : "BEARISH";

  return {
    name: "MACD",
    value: macdVal.toFixed(3),
    signal,
  };
}

export function calcEMA20(closes: number[]): IndicatorResult {
  if (closes.length < 20) {
    return { name: "EMA (20)", value: "N/A", signal: "NEUTRAL" };
  }

  const ema20 = ema(closes, 20);
  const currentEma = ema20[ema20.length - 1];
  const currentPrice = closes[closes.length - 1];

  const signal: Signal = currentPrice > currentEma ? "BULLISH" : "BEARISH";

  return {
    name: "EMA (20)",
    value: currentEma.toFixed(3),
    signal,
  };
}

export function calcBollinger(closes: number[], period = 20, mult = 2): IndicatorResult {
  if (closes.length < period) {
    return { name: "Bollinger", value: "N/A", signal: "NEUTRAL" };
  }

  const slice = closes.slice(-period);
  const sma = slice.reduce((a, b) => a + b, 0) / period;
  const variance = slice.reduce((sum, v) => sum + (v - sma) ** 2, 0) / period;
  const stdDev = Math.sqrt(variance);

  const upper = sma + mult * stdDev;
  const lower = sma - mult * stdDev;
  const price = closes[closes.length - 1];

  const range = upper - lower;
  const pos = range === 0 ? 0.5 : (price - lower) / range;

  let signal: Signal = "NEUTRAL";
  if (pos < 0.2) signal = "BULLISH";
  else if (pos > 0.8) signal = "BEARISH";

  return {
    name: "Bollinger",
    value: `${lower.toFixed(3)} - ${upper.toFixed(3)}`,
    signal,
  };
}

export function calcVolumeTrend(data: OHLCV[]): IndicatorResult {
  if (data.length < 20) {
    return { name: "Volume", value: "N/A", signal: "NEUTRAL" };
  }

  const last5 = data.slice(-5).reduce((s, d) => s + d.volume, 0) / 5;
  const last20 = data.slice(-20).reduce((s, d) => s + d.volume, 0) / 20;

  const ratio = last20 === 0 ? 1 : last5 / last20;
  const priceChange = data[data.length - 1].close - data[data.length - 6].close;

  let signal: Signal = "NEUTRAL";
  if (ratio > 1.1 && priceChange > 0) signal = "BULLISH";
  else if (ratio > 1.1 && priceChange < 0) signal = "BEARISH";

  const formatted = last5 > 1_000_000
    ? `${(last5 / 1_000_000).toFixed(1)}M`
    : `${(last5 / 1_000).toFixed(0)}K`;

  return {
    name: "Volume",
    value: formatted,
    signal,
  };
}

export function calcPivotPoints(data: OHLCV[]): PivotPoints {
  if (data.length === 0) {
    return { r2: 0, r1: 0, pivot: 0, s1: 0, s2: 0 };
  }

  const prev = data[data.length - 2] || data[data.length - 1];
  const { high, low, close } = prev;

  const pivot = (high + low + close) / 3;
  const r1 = 2 * pivot - low;
  const r2 = pivot + (high - low);
  const s1 = 2 * pivot - high;
  const s2 = pivot - (high - low);

  return { r2, r1, pivot, s1, s2 };
}
