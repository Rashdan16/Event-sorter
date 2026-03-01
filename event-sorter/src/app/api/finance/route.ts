import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

interface CacheEntry {
  data: unknown;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const QUOTE_TTL = 15_000;
const HISTORICAL_TTL = 300_000;

function getCached(key: string, ttl: number): unknown | null {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.timestamp < ttl) {
    return entry.data;
  }
  return null;
}

function setCache(key: string, data: unknown) {
  cache.set(key, { data, timestamp: Date.now() });
}

function getStale(key: string): unknown | null {
  const entry = cache.get(key);
  return entry ? entry.data : null;
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get("symbol") || "NG=F";
  const range = searchParams.get("range") || "1y";
  const interval = searchParams.get("interval") || "1d";

  const cacheKey = `${symbol}:${range}:${interval}`;
  const ttl = interval === "1d" ? HISTORICAL_TTL : QUOTE_TTL;

  const cached = getCached(cacheKey, ttl);
  if (cached) {
    return NextResponse.json(cached);
  }

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}&includePrePost=false`;

    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "application/json",
      },
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      const stale = getStale(cacheKey);
      if (stale) {
        return NextResponse.json(stale);
      }
      return NextResponse.json(
        { error: `Yahoo Finance returned ${response.status}` },
        { status: response.status }
      );
    }

    const json = await response.json();
    const result = json?.chart?.result?.[0];

    if (!result) {
      return NextResponse.json(
        { error: "No data returned from Yahoo Finance" },
        { status: 404 }
      );
    }

    const meta = result.meta;
    const timestamps = result.timestamp || [];
    const quote = result.indicators?.quote?.[0] || {};

    const historical = timestamps.map((t: number, i: number) => ({
      date: t,
      open: quote.open?.[i] ?? 0,
      high: quote.high?.[i] ?? 0,
      low: quote.low?.[i] ?? 0,
      close: quote.close?.[i] ?? 0,
      volume: quote.volume?.[i] ?? 0,
    })).filter((d: { close: number }) => d.close > 0);

    const data = {
      symbol: meta.symbol,
      shortName: meta.shortName || meta.symbol,
      currency: meta.currency,
      price: meta.regularMarketPrice,
      previousClose: meta.chartPreviousClose || meta.previousClose,
      open: quote.open?.[timestamps.length - 1] ?? meta.regularMarketPrice,
      dayHigh: quote.high?.[timestamps.length - 1] ?? meta.regularMarketPrice,
      dayLow: quote.low?.[timestamps.length - 1] ?? meta.regularMarketPrice,
      volume: quote.volume?.[timestamps.length - 1] ?? 0,
      historical,
      timestamp: Date.now(),
    };

    setCache(cacheKey, data);

    return NextResponse.json(data);
  } catch (error) {
    const stale = getStale(cacheKey);
    if (stale) {
      return NextResponse.json(stale);
    }
    return NextResponse.json(
      { error: "Failed to fetch finance data" },
      { status: 500 }
    );
  }
}
