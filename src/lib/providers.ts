import { RateEntry, RatesData } from "@/types";

// ============================================================
// Configuración de APIs
// ============================================================
const API_CONFIG = {
  dolarApi: {
    name: "ve.dolarapi.com",
    usd: "https://ve.dolarapi.com/v1/dolares",
    eur: "https://ve.dolarapi.com/v1/euros/oficial",
  },
  pydolarve: {
    name: "pydolarve.org",
    url: "https://pydolarve.org/api/v2/dollar?page=bcv",
  },
  timeout: 5000,
  usdtFallbackMultiplier: 1.02,
  eurFallbackMultiplier: 1.18,
} as const;

async function fetchWithTimeout(
  url: string,
  ms = API_CONFIG.timeout,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ms);

  try {
    return await fetch(url, { signal: controller.signal, cache: "no-store" });
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchDolarApi(): Promise<{
  bcv: number;
  usdt: number;
  bcvDate: string;
  usdtDate: string;
} | null> {
  try {
    const res = await fetchWithTimeout(API_CONFIG.dolarApi.usd);
    if (!res.ok) throw new Error(`dolarapi status ${res.status}`);
    const data = await res.json();

    const oficial = data.find(
      (d: { fuente: string }) => d.fuente === "oficial",
    );
    const paralelo = data.find(
      (d: { fuente: string }) => d.fuente === "paralelo",
    );
    const bcv = oficial?.promedio ?? null;
    const usdt = paralelo?.promedio ?? null;

    if (bcv) {
      return {
        bcv,
        usdt: usdt ?? bcv * API_CONFIG.usdtFallbackMultiplier,
        bcvDate: oficial?.fechaActualizacion ?? new Date().toISOString(),
        usdtDate: paralelo?.fechaActualizacion ?? new Date().toISOString(),
      };
    }
    return null;
  } catch {
    return null;
  }
}

async function fetchEuroApi(): Promise<{ eur: number; date: string } | null> {
  try {
    const res = await fetchWithTimeout(API_CONFIG.dolarApi.eur);
    if (!res.ok) throw new Error(`dolarapi euro status ${res.status}`);
    const data = await res.json();
    const eur = data?.promedio ?? null;
    if (eur)
      return {
        eur,
        date: data?.fechaActualizacion ?? new Date().toISOString(),
      };
    return null;
  } catch {
    return null;
  }
}

async function fetchPydolarve(): Promise<RateEntry[] | null> {
  try {
    const res = await fetchWithTimeout(API_CONFIG.pydolarve.url);
    if (!res.ok) throw new Error(`pydolarve status ${res.status}`);
    const data = await res.json();
    const usd = data?.monitors?.usd?.price;
    const eur = data?.monitors?.eur?.price;
    const now = new Date().toISOString();
    if (usd && eur) {
      return [
        { name: "Dólar BCV", symbol: "USD", rate: usd, lastUpdate: now },
        { name: "Euro BCV", symbol: "EUR", rate: eur, lastUpdate: now },
        {
          name: "USDT",
          symbol: "USDT",
          rate: usd * API_CONFIG.usdtFallbackMultiplier,
          lastUpdate: now,
        },
      ];
    }
    return null;
  } catch {
    return null;
  }
}

export async function fetchFreshRates(): Promise<RatesData | null> {
  const now = new Date().toISOString();

  // Intento 1: ve.dolarapi.com
  const [dolarData, euroData] = await Promise.all([
    fetchDolarApi(),
    fetchEuroApi(),
  ]);

  if (dolarData) {
    const rates: RateEntry[] = [
      {
        name: "Dólar BCV",
        symbol: "USD",
        rate: dolarData.bcv,
        lastUpdate: dolarData.bcvDate,
      },
      {
        name: "Euro BCV",
        symbol: "EUR",
        rate: euroData?.eur ?? dolarData.bcv * API_CONFIG.eurFallbackMultiplier,
        lastUpdate: euroData?.date ?? now,
      },
      {
        name: "USDT",
        symbol: "USDT",
        rate: dolarData.usdt,
        lastUpdate: dolarData.usdtDate,
      },
    ];
    console.log(`✅ Datos frescos de ${API_CONFIG.dolarApi.name}`);
    return { rates, fetchedAt: now, source: "api" };
  }

  // Intento 2: pydolarve.org (respaldo)
  console.warn(
    `⚠ ${API_CONFIG.dolarApi.name} falló. Intentando ${API_CONFIG.pydolarve.name}...`,
  );
  const backupRates = await fetchPydolarve();
  if (backupRates) {
    console.log(`✅ Datos frescos de ${API_CONFIG.pydolarve.name}`);
    return { rates: backupRates, fetchedAt: now, source: "api" };
  }

  return null;
}
