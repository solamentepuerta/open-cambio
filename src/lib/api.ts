import fs from "fs";
import path from "path";
import {
  DailyEntry,
  DailyRates,
  HistoryEntry,
  RateEntry,
  RatesData,
  RefreshResult,
} from "@/types";
import {
  acquireRedisLock,
  releaseRedisLock,
  safeRedisGet,
  safeRedisSet,
} from "@/lib/redis";

const TIME_ZONE = "America/Caracas";
const CURRENT_KEY = "rates:current";
const DAILY_KEY = "rates:daily";
const HISTORY_KEY = "rates:history";
const LOCK_KEY = "rates:fetching_lock";
const CURRENT_TTL_SECONDS = 7 * 24 * 60 * 60;
const DAILY_TTL_SECONDS = 400 * 24 * 60 * 60;
const HISTORY_TTL_SECONDS = 90 * 24 * 60 * 60;
const LOCK_TTL_SECONDS = 30;
const DAILY_RETENTION_DAYS = 400;
const HISTORY_RETENTION_DAYS = 90;
const CACHE_FILE = path.join(process.cwd(), "data", "rates-cache.json");
const DAILY_FILE = path.join(process.cwd(), "data", "rates-daily.json");

const EMERGENCY_RATES: RateEntry[] = [
  { name: "Dólar BCV", symbol: "USD", rate: 500.46, lastUpdate: "2026-05-08T22:50:16.923Z" },
  { name: "Euro BCV", symbol: "EUR", rate: 588.1, lastUpdate: "2026-05-08T22:50:16.923Z" },
  { name: "USDT", symbol: "USDT", rate: 649.48, lastUpdate: "2026-05-08T22:50:16.923Z" },
];

export interface ExchangeRateOptions {
  forceRefresh?: boolean;
  recordDaily?: boolean;
  now?: Date;
}

function getDateParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  return Object.fromEntries(parts.map(({ type, value }) => [type, value]));
}

export function getVenezuelaDateKey(date: Date | string): string {
  const parts = getDateParts(new Date(date));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function isVenezuelaWeekend(date: Date): boolean {
  const weekday = getDateParts(date).weekday;
  return weekday === "Sat" || weekday === "Sun";
}

function getAdaptiveCacheDuration(date: Date): number {
  const parts = getDateParts(date);
  if (parts.weekday === "Sat" || parts.weekday === "Sun") return 24 * 60 * 60 * 1000;
  const hour = Number(parts.hour);
  return hour >= 21 || hour < 8 ? 12 * 60 * 60 * 1000 : 8 * 60 * 60 * 1000;
}

function isValidRatesData(value: unknown): value is RatesData {
  if (!value || typeof value !== "object") return false;
  const data = value as Partial<RatesData>;
  return Boolean(
    Array.isArray(data.rates) &&
      data.rates.length > 0 &&
      data.rates.every((rate) => Number.isFinite(rate.rate) && rate.rate > 0) &&
      data.fetchedAt &&
      !Number.isNaN(Date.parse(data.fetchedAt)),
  );
}

function readJsonFile<T>(file: string): T | null {
  try {
    if (!fs.existsSync(file)) return null;
    return JSON.parse(fs.readFileSync(file, "utf-8")) as T;
  } catch {
    return null;
  }
}

async function readCurrentCache(): Promise<RatesData | null> {
  const redisData = await safeRedisGet<RatesData>(CURRENT_KEY);
  if (isValidRatesData(redisData)) return redisData;
  const localData = readJsonFile<RatesData>(CACHE_FILE);
  return isValidRatesData(localData) ? localData : null;
}

function toDailyEntry(data: RatesData): DailyEntry | null {
  const usd = data.rates.find((rate) => rate.symbol === "USD")?.rate;
  const eur = data.rates.find((rate) => rate.symbol === "EUR")?.rate;
  const usdt = data.rates.find((rate) => rate.symbol === "USDT")?.rate;
  if (![usd, eur, usdt].every((rate) => Number.isFinite(rate) && Number(rate) > 0)) return null;
  return { usd: usd!, eur: eur!, usdt: usdt!, date: data.fetchedAt };
}

function trimDaily(daily: DailyRates, now: Date): DailyRates {
  const cutoff = new Date(now.getTime() - DAILY_RETENTION_DAYS * 86_400_000);
  const cutoffKey = getVenezuelaDateKey(cutoff);
  return Object.fromEntries(Object.entries(daily).filter(([key]) => key >= cutoffKey));
}

export function parseDailyRatesPayload(value: unknown): DailyRates | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const parsed: DailyRates = {};
  for (const [key, rawEntry] of Object.entries(value)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(key) || !rawEntry || typeof rawEntry !== "object") continue;
    const entry = rawEntry as Partial<DailyEntry>;
    if (
      ![entry.usd, entry.eur, entry.usdt].every(
        (rate) => typeof rate === "number" && Number.isFinite(rate) && rate > 0,
      ) ||
      typeof entry.date !== "string" ||
      Number.isNaN(Date.parse(entry.date))
    ) continue;
    parsed[key] = {
      usd: entry.usd!,
      eur: entry.eur!,
      usdt: entry.usdt!,
      date: entry.date,
    };
  }

  return Object.keys(parsed).length ? parsed : null;
}

function trimHistory(history: HistoryEntry[], now: Date): HistoryEntry[] {
  const cutoff = now.getTime() - HISTORY_RETENTION_DAYS * 86_400_000;
  return history.filter((entry) => Date.parse(entry.date) >= cutoff).slice(-300);
}

async function recordRates(data: RatesData, now: Date): Promise<void> {
  const entry = toDailyEntry(data);
  if (!entry) return;
  const dayKey = getVenezuelaDateKey(now);
  const [redisDaily, redisHistory] = await Promise.all([
    safeRedisGet<DailyRates>(DAILY_KEY),
    safeRedisGet<HistoryEntry[]>(HISTORY_KEY),
  ]);
  const localDaily = readJsonFile<DailyRates>(DAILY_FILE) ?? {};
  const daily = trimDaily({ ...localDaily, ...redisDaily, [dayKey]: entry }, now);
  const history = trimHistory([...(redisHistory ?? []), entry], now);
  await Promise.all([
    safeRedisSet(DAILY_KEY, daily, DAILY_TTL_SECONDS),
    safeRedisSet(HISTORY_KEY, history, HISTORY_TTL_SECONDS),
  ]);
}

async function cacheFreshRates(data: RatesData, now: Date, recordDaily: boolean): Promise<void> {
  await safeRedisSet(CURRENT_KEY, data, CURRENT_TTL_SECONDS);
  if (recordDaily) await recordRates(data, now);
}

function isCacheFresh(data: RatesData, now: Date): boolean {
  return now.getTime() - Date.parse(data.fetchedAt) < getAdaptiveCacheDuration(now);
}

async function fetchWithTimeout(
  url: string,
  ms = 5000,
  init: RequestInit & { next?: { revalidate: number } } = { cache: "no-store" },
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchDolarApi() {
  try {
    const response = await fetchWithTimeout("https://ve.dolarapi.com/v1/dolares");
    if (!response.ok) return null;
    const data = (await response.json()) as Array<Record<string, unknown>>;
    const official = data.find((item) => item.fuente === "oficial");
    const parallel = data.find((item) => item.fuente === "paralelo");
    const bcv = Number(official?.promedio);
    if (!Number.isFinite(bcv) || bcv <= 0) return null;
    const usdtValue = Number(parallel?.promedio);
    return {
      bcv,
      usdt: Number.isFinite(usdtValue) && usdtValue > 0 ? usdtValue : bcv * 1.02,
      bcvDate: String(official?.fechaActualizacion ?? new Date().toISOString()),
      usdtDate: String(parallel?.fechaActualizacion ?? new Date().toISOString()),
    };
  } catch {
    return null;
  }
}

async function fetchEuroApi() {
  try {
    const response = await fetchWithTimeout("https://ve.dolarapi.com/v1/euros/oficial");
    if (!response.ok) return null;
    const data = (await response.json()) as Record<string, unknown>;
    const eur = Number(data.promedio);
    return Number.isFinite(eur) && eur > 0
      ? { eur, date: String(data.fechaActualizacion ?? new Date().toISOString()) }
      : null;
  } catch {
    return null;
  }
}

interface BcvScraperResponse {
  source: string;
  capturedAt: string;
  effectiveDate: string;
  rates: { USD: number; EUR: number; USDT?: number };
  usdtFresh?: boolean;
}

export function parseBcvEffectiveDate(value: string): string | null {
  const match = value.match(/(?:Lunes|Martes|Mi[eé]rcoles|Jueves|Viernes|S[aá]bado|Domingo),?\s+(\d{1,2})\s+([A-Za-zÁÉÍÓÚáéíóú]+)\s+(\d{4})/iu);
  if (!match) return null;
  const months: Record<string, number> = {
    enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5,
    julio: 6, agosto: 7, septiembre: 8, octubre: 9, noviembre: 10, diciembre: 11,
  };
  const month = months[match[2].toLocaleLowerCase("es-VE")];
  if (month === undefined) return null;
  const date = new Date(Date.UTC(Number(match[3]), month, Number(match[1]), 16, 0, 0));
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

async function fetchBcvScraper(): Promise<{
  usd: number;
  eur: number;
  usdt: number | null;
  capturedAt: string;
  effectiveAt: string;
} | null> {
  try {
    const url = process.env.BCV_SCRAPER_URL
      ?? "https://puertale.com/bcv-scraper-test/latest.json";
    const response = await fetchWithTimeout(url);
    if (!response.ok) return null;
    const data = (await response.json()) as BcvScraperResponse;
    const usd = Number(data.rates?.USD);
    const eur = Number(data.rates?.EUR);
    const capturedAt = new Date(data.capturedAt);
    const effectiveAt = parseBcvEffectiveDate(data.effectiveDate);
    if (
      !["bcv.org.ve", "vex-scraper"].includes(data.source) ||
      !Number.isFinite(usd) || usd <= 0 ||
      !Number.isFinite(eur) || eur <= 0 ||
      Number.isNaN(capturedAt.getTime()) ||
      !effectiveAt
    ) return null;
    const usdtValue = Number(data.rates?.USDT);
    const usdt = data.usdtFresh !== false && Number.isFinite(usdtValue) && usdtValue > 0
      ? usdtValue
      : null;
    return { usd, eur, usdt, capturedAt: capturedAt.toISOString(), effectiveAt };
  } catch {
    return null;
  }
}

async function fetchCpanelDailyRates(): Promise<DailyRates | null> {
  try {
    const url = process.env.BCV_HISTORY_URL
      ?? "https://puertale.com/bcv-scraper-test/daily-rates.json";
    const response = await fetchWithTimeout(url);
    if (!response.ok) return null;
    return parseDailyRatesPayload(await response.json());
  } catch {
    return null;
  }
}

async function fetchPydolarve(): Promise<RateEntry[] | null> {
  try {
    const response = await fetchWithTimeout("https://pydolarve.org/api/v2/dollar?page=bcv");
    if (!response.ok) return null;
    const data = (await response.json()) as { monitors?: { usd?: { price?: number }; eur?: { price?: number } } };
    const usd = Number(data.monitors?.usd?.price);
    const eur = Number(data.monitors?.eur?.price);
    if (!Number.isFinite(usd) || !Number.isFinite(eur) || usd <= 0 || eur <= 0) return null;
    const now = new Date().toISOString();
    return [
      { name: "Dólar BCV", symbol: "USD", rate: usd, lastUpdate: now },
      { name: "Euro BCV", symbol: "EUR", rate: eur, lastUpdate: now },
      { name: "USDT", symbol: "USDT", rate: usd * 1.02, lastUpdate: now },
    ];
  } catch {
    return null;
  }
}

async function fetchFreshRates(now: Date): Promise<RatesData | null> {
  const [bcv, dollar, euro] = await Promise.all([
    fetchBcvScraper(),
    fetchDolarApi(),
    fetchEuroApi(),
  ]);
  if (bcv) {
    return {
      rates: [
        { name: "Dólar BCV", symbol: "USD", rate: bcv.usd, lastUpdate: bcv.effectiveAt },
        { name: "Euro BCV", symbol: "EUR", rate: bcv.eur, lastUpdate: bcv.effectiveAt },
        { name: "USDT", symbol: "USDT", rate: bcv.usdt ?? dollar?.usdt ?? bcv.usd * 1.02, lastUpdate: bcv.usdt ? bcv.capturedAt : dollar?.usdtDate ?? bcv.capturedAt },
      ],
      fetchedAt: bcv.capturedAt,
      source: "api",
    };
  }
  if (dollar) {
    return {
      rates: [
        { name: "Dólar BCV", symbol: "USD", rate: dollar.bcv, lastUpdate: dollar.bcvDate },
        { name: "Euro BCV", symbol: "EUR", rate: euro?.eur ?? dollar.bcv * 1.18, lastUpdate: euro?.date ?? now.toISOString() },
        { name: "USDT", symbol: "USDT", rate: dollar.usdt, lastUpdate: dollar.usdtDate },
      ],
      fetchedAt: now.toISOString(),
      source: "api",
    };
  }
  const backup = await fetchPydolarve();
  return backup ? { rates: backup, fetchedAt: now.toISOString(), source: "api" } : null;
}

async function waitForConcurrentRefresh(fallback: RatesData | null): Promise<RatesData | null> {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const cached = await safeRedisGet<RatesData>(CURRENT_KEY);
    if (isValidRatesData(cached) && (!fallback || cached.fetchedAt !== fallback.fetchedAt)) return cached;
  }
  return fallback;
}

export async function getExchangeRates(
  options: ExchangeRateOptions = {},
): Promise<RefreshResult> {
  const now = options.now ?? new Date();
  const recordDaily = options.recordDaily ?? true;
  const cached = await readCurrentCache();

  if (isVenezuelaWeekend(now) && cached && !options.forceRefresh) {
    const weekendData = { ...cached, source: "weekend-cache" as const };
    if (recordDaily) await recordRates(weekendData, now);
    return { rates: weekendData, refreshed: false };
  }

  if (!options.forceRefresh && cached && isCacheFresh(cached, now)) {
    return { rates: { ...cached, source: "cache" }, refreshed: false };
  }

  const lockToken = await acquireRedisLock(LOCK_KEY, LOCK_TTL_SECONDS);
  if (!lockToken) {
    const concurrent = await waitForConcurrentRefresh(cached);
    if (concurrent) return { rates: { ...concurrent, source: "cache" }, refreshed: false };
  }

  try {
    const fresh = await fetchFreshRates(now);
    if (fresh) {
      await cacheFreshRates(fresh, now, recordDaily);
      return { rates: fresh, refreshed: true };
    }
    if (cached) return { rates: { ...cached, source: "fallback" }, refreshed: false };
    return {
      rates: { rates: EMERGENCY_RATES, fetchedAt: EMERGENCY_RATES[0].lastUpdate, source: "fallback" },
      refreshed: false,
    };
  } finally {
    if (lockToken) await releaseRedisLock(LOCK_KEY, lockToken);
  }
}

export async function getDailyRates(): Promise<DailyRates> {
  const [remoteDaily, redisDaily] = await Promise.all([
    fetchCpanelDailyRates(),
    safeRedisGet<DailyRates>(DAILY_KEY),
  ]);
  const localDaily = readJsonFile<DailyRates>(DAILY_FILE) ?? {};
  const daily = trimDaily({ ...localDaily, ...redisDaily, ...remoteDaily }, new Date());
  if (Object.keys(daily).length) await safeRedisSet(DAILY_KEY, daily, DAILY_TTL_SECONDS);
  return daily;
}

export async function replaceDailyRates(daily: DailyRates): Promise<boolean> {
  return safeRedisSet(DAILY_KEY, trimDaily(daily, new Date()), DAILY_TTL_SECONDS);
}

export async function getPreviousDayRates(reference = new Date()): Promise<DailyEntry | null> {
  const daily = await getDailyRates();
  const referenceKey = getVenezuelaDateKey(reference);
  const previousKey = Object.keys(daily).filter((key) => key < referenceKey).sort().at(-1);
  return previousKey ? daily[previousKey] : null;
}
