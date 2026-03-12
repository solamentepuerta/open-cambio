import path from "path";
import { RateEntry } from "@/types";

// ============================================================
// Constantes de configuración
// ============================================================
export const CACHE_DURATION_MS = 8 * 60 * 60 * 1000; // 8 horas
export const CACHE_FILE = path.join(process.cwd(), "data", "rates-cache.json");
export const HISTORY_FILE = path.join(process.cwd(), "data", "rates-history.json");
export const DAILY_FILE = path.join(process.cwd(), "data", "rates-daily.json");

// ============================================================
// Fallback hardcodeado (último recurso si todo falla)
// ============================================================
export const FALLBACK_RATES: RateEntry[] = [
    {
        name: "Dólar BCV",
        symbol: "USD",
        rate: 414.04,
        lastUpdate: "2026-02-26T21:00:00.000Z",
    },
    {
        name: "Euro BCV",
        symbol: "EUR",
        rate: 488.60,
        lastUpdate: "2026-02-26T21:00:00.000Z",
    },
    {
        name: "USDT",
        symbol: "USDT",
        rate: 610.92,
        lastUpdate: "2026-02-26T21:00:00.000Z",
    },
];
