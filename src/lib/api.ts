import { RatesData, RateEntry } from "@/types";
import fs from "fs";
import path from "path";

// ============================================================
// Configuración del cache
// ============================================================
const CACHE_DURATION_MS = 8 * 60 * 60 * 1000; // 8 horas en milisegundos
const CACHE_FILE = path.join(process.cwd(), "data", "rates-cache.json");
const HISTORY_FILE = path.join(process.cwd(), "data", "rates-history.json");
const DAILY_FILE = path.join(process.cwd(), "data", "rates-daily.json");

// ============================================================
// Fallback hardcodeado (último recurso si todo falla)
// ============================================================
const FALLBACK_RATES: RateEntry[] = [
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

// ============================================================
// Cache: leer / escribir el JSON
// ============================================================
function readCache(): RatesData | null {
    try {
        if (!fs.existsSync(CACHE_FILE)) return null;
        const raw = fs.readFileSync(CACHE_FILE, "utf-8");
        return JSON.parse(raw) as RatesData;
    } catch {
        return null;
    }
}

function writeCache(data: RatesData): void {
    try {
        const dir = path.dirname(CACHE_FILE);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2), "utf-8");
        console.log("💾 Cache actualizado:", CACHE_FILE);

        // Registrar en historial detallado
        appendHistory(data);
        // Registrar en resumen diario (1 por día)
        updateDailyRecord(data);
    } catch (err) {
        console.error("⚠ No se pudo escribir el cache:", err);
    }
}

// ============================================================
// Historial detallado: cada refresco (3 veces/día)
// ============================================================
interface HistoryEntry {
    date: string;
    usd: number | null;
    eur: number | null;
    usdt: number | null;
}

function appendHistory(data: RatesData): void {
    try {
        const entry: HistoryEntry = {
            date: data.fetchedAt,
            usd: data.rates.find(r => r.symbol === "USD")?.rate ?? null,
            eur: data.rates.find(r => r.symbol === "EUR")?.rate ?? null,
            usdt: data.rates.find(r => r.symbol === "USDT")?.rate ?? null,
        };

        let history: HistoryEntry[] = [];
        if (fs.existsSync(HISTORY_FILE)) {
            const raw = fs.readFileSync(HISTORY_FILE, "utf-8");
            history = JSON.parse(raw);
        }

        history.push(entry);
        fs.writeFileSync(HISTORY_FILE, JSON.stringify(history), "utf-8");
        console.log(`📊 Historial actualizado: ${history.length} entradas`);
    } catch (err) {
        console.error("⚠ No se pudo actualizar el historial:", err);
    }
}

// ============================================================
// Resumen Diario: solo el ÚLTIMO registro de cada día
// Formato: { "2026-02-26": { usd, eur, usdt, date }, ... }
// Un año ≈ 365 entradas ≈ 25 KB. Ultra ligero.
// ============================================================
export interface DailyEntry {
    usd: number;
    eur: number;
    usdt: number;
    date: string; // ISO timestamp del último registro
}

export type DailyRates = Record<string, DailyEntry>; // key = "YYYY-MM-DD"

function updateDailyRecord(data: RatesData): void {
    try {
        const dayKey = data.fetchedAt.slice(0, 10); // "2026-02-26"
        const entry: DailyEntry = {
            usd: data.rates.find(r => r.symbol === "USD")?.rate ?? 0,
            eur: data.rates.find(r => r.symbol === "EUR")?.rate ?? 0,
            usdt: data.rates.find(r => r.symbol === "USDT")?.rate ?? 0,
            date: data.fetchedAt,
        };

        let daily: DailyRates = {};
        if (fs.existsSync(DAILY_FILE)) {
            const raw = fs.readFileSync(DAILY_FILE, "utf-8");
            daily = JSON.parse(raw);
        }

        // Sobrescribe el día actual con la última entrada
        daily[dayKey] = entry;
        fs.writeFileSync(DAILY_FILE, JSON.stringify(daily, null, 2), "utf-8");
        console.log(`📅 Registro diario actualizado: ${Object.keys(daily).length} días`);
    } catch (err) {
        console.error("⚠ No se pudo actualizar el registro diario:", err);
    }
}

function isCacheFresh(data: RatesData): boolean {
    const cachedTime = new Date(data.fetchedAt).getTime();
    const now = Date.now();
    const ageMs = now - cachedTime;
    const ageHours = (ageMs / (1000 * 60 * 60)).toFixed(1);
    console.log(`🕐 Cache tiene ${ageHours}h de antigüedad (máx: 8h)`);
    return ageMs < CACHE_DURATION_MS;
}

// ============================================================
// fetch con timeout de 5s (AbortController)
// ============================================================
async function fetchWithTimeout(url: string, ms = 5000): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), ms);

    try {
        return await fetch(url, { signal: controller.signal, cache: "no-store" });
    } finally {
        clearTimeout(timeoutId);
    }
}

// ============================================================
// Fuentes de datos
// ============================================================
async function fetchDolarApi(): Promise<{
    bcv: number; usdt: number; bcvDate: string; usdtDate: string;
} | null> {
    try {
        const res = await fetchWithTimeout("https://ve.dolarapi.com/v1/dolares");
        if (!res.ok) throw new Error(`dolarapi status ${res.status}`);
        const data = await res.json();

        const oficial = data.find((d: { fuente: string }) => d.fuente === "oficial");
        const paralelo = data.find((d: { fuente: string }) => d.fuente === "paralelo");
        const bcv = oficial?.promedio ?? null;
        const usdt = paralelo?.promedio ?? null;

        if (bcv) {
            return {
                bcv,
                usdt: usdt ?? bcv * 1.02,
                bcvDate: oficial?.fechaActualizacion ?? new Date().toISOString(),
                usdtDate: paralelo?.fechaActualizacion ?? new Date().toISOString(),
            };
        }
        return null;
    } catch { return null; }
}

async function fetchEuroApi(): Promise<{ eur: number; date: string } | null> {
    try {
        const res = await fetchWithTimeout("https://ve.dolarapi.com/v1/euros/oficial");
        if (!res.ok) throw new Error(`dolarapi euro status ${res.status}`);
        const data = await res.json();
        const eur = data?.promedio ?? null;
        if (eur) return { eur, date: data?.fechaActualizacion ?? new Date().toISOString() };
        return null;
    } catch { return null; }
}

async function fetchPydolarve(): Promise<RateEntry[] | null> {
    try {
        const res = await fetchWithTimeout("https://pydolarve.org/api/v2/dollar?page=bcv");
        if (!res.ok) throw new Error(`pydolarve status ${res.status}`);
        const data = await res.json();
        const usd = data?.monitors?.usd?.price;
        const eur = data?.monitors?.eur?.price;
        const now = new Date().toISOString();
        if (usd && eur) {
            return [
                { name: "Dólar BCV", symbol: "USD", rate: usd, lastUpdate: now },
                { name: "Euro BCV", symbol: "EUR", rate: eur, lastUpdate: now },
                { name: "USDT", symbol: "USDT", rate: usd * 1.02, lastUpdate: now },
            ];
        }
        return null;
    } catch { return null; }
}

// ============================================================
// Obtener tasas frescas de las APIs (waterfall)
// ============================================================
async function fetchFreshRates(): Promise<RatesData | null> {
    const now = new Date().toISOString();

    // Paso 1: ve.dolarapi.com
    const [dolarData, euroData] = await Promise.all([
        fetchDolarApi(),
        fetchEuroApi(),
    ]);

    if (dolarData) {
        const rates: RateEntry[] = [
            { name: "Dólar BCV", symbol: "USD", rate: dolarData.bcv, lastUpdate: dolarData.bcvDate },
            { name: "Euro BCV", symbol: "EUR", rate: euroData?.eur ?? dolarData.bcv * 1.18, lastUpdate: euroData?.date ?? now },
            { name: "USDT", symbol: "USDT", rate: dolarData.usdt, lastUpdate: dolarData.usdtDate },
        ];
        console.log("✅ Datos frescos de ve.dolarapi.com");
        return { rates, fetchedAt: now, source: "api" };
    }

    // Paso 2: pydolarve.org (respaldo)
    console.warn("⚠ ve.dolarapi.com falló. Intentando pydolarve...");
    const backupRates = await fetchPydolarve();
    if (backupRates) {
        console.log("✅ Datos frescos de pydolarve.org");
        return { rates: backupRates, fetchedAt: now, source: "api" };
    }

    return null; // Todas las APIs fallaron
}

// ============================================================
// Función principal: getExchangeRates()
//
// 1. Lee el JSON cache → si tiene < 8 horas, lo devuelve (sin API)
// 2. Si el cache está viejo o no existe → consulta la API
// 3. Guarda el resultado nuevo en el JSON (para todos)
// 4. Si la API falla → devuelve el cache viejo o el fallback
// ============================================================
export async function getExchangeRates(): Promise<RatesData> {
    const now = new Date().toISOString();

    // ── Paso 1: Intentar leer del cache ──
    const cached = readCache();

    if (cached && isCacheFresh(cached)) {
        console.log("📦 Sirviendo desde cache (sin consulta a la API)");
        return cached;
    }

    // ── Paso 2: Cache viejo o inexistente → consultar API ──
    console.log("🔄 Cache expirado o inexistente. Consultando API...");

    try {
        const freshData = await fetchFreshRates();

        if (freshData) {
            // Guardar en el JSON para que todos lean de aquí
            writeCache(freshData);
            return freshData;
        }

        // API falló pero tenemos cache viejo → usarlo
        if (cached) {
            console.warn("⚠ API falló, usando cache anterior (datos pueden estar desactualizados)");
            return { ...cached, source: "fallback" };
        }

        throw new Error("Sin cache ni API disponible");
    } catch (error) {
        console.error("❌ Error total, usando fallback local:", error);
        const fallbackData: RatesData = { rates: FALLBACK_RATES, fetchedAt: now, source: "fallback" };
        writeCache(fallbackData); // Guardar fallback para no reintentar inmediatamente
        return fallbackData;
    }
}
