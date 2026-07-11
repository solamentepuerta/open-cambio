export interface RateEntry {
  name: string;
  symbol: string;
  rate: number;
  lastUpdate: string;
}

export type RatesSource = "api" | "cache" | "weekend-cache" | "fallback";

export interface RatesData {
  rates: RateEntry[];
  fetchedAt: string;
  source: RatesSource;
}

export interface DailyEntry {
  usd: number;
  eur: number;
  usdt: number;
  date: string;
}

export type DailyRates = Record<string, DailyEntry>;

export interface HistoryEntry extends DailyEntry {
  date: string;
}

export interface RefreshResult {
  rates: RatesData;
  refreshed: boolean;
}
