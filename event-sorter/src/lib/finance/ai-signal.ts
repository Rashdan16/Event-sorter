import { OHLCV, AISignal, IndicatorResult, Signal } from "./types";
import {
  calcRSI,
  calcMACD,
  calcEMA20,
  calcBollinger,
  calcVolumeTrend,
  calcPivotPoints,
} from "./indicators";

export function generateAISignal(data: OHLCV[]): AISignal {
  const closes = data.map((d) => d.close);

  const indicators: IndicatorResult[] = [
    calcRSI(closes),
    calcMACD(closes),
    calcEMA20(closes),
    calcBollinger(closes),
    calcVolumeTrend(data),
  ];

  const pivots = calcPivotPoints(data);

  let bulls = 0;
  let bears = 0;
  for (const ind of indicators) {
    if (ind.signal === "BULLISH") bulls++;
    else if (ind.signal === "BEARISH") bears++;
  }

  let recommendation: "BUY" | "HOLD" | "SELL";
  if (bulls >= bears + 2) recommendation = "BUY";
  else if (bears >= bulls + 2) recommendation = "SELL";
  else recommendation = "HOLD";

  const total = indicators.length;
  const confidence = Math.round(
    (Math.max(bulls, bears) / total) * 100
  );

  const rsi = indicators[0];
  const macd = indicators[1];

  const signalDescriptions: Record<Signal, string> = {
    BULLISH: "bullish",
    BEARISH: "bearish",
    NEUTRAL: "neutral",
  };

  const description =
    `RSI at ${rsi.value} is ${signalDescriptions[rsi.signal]}. ` +
    `MACD is ${signalDescriptions[macd.signal]} at ${macd.value}. ` +
    `${bulls} of ${total} indicators are bullish, ${bears} bearish.`;

  return {
    recommendation,
    confidence,
    description,
    indicators,
    pivots,
  };
}
