import { RatesData } from "@/types";
import { FALLBACK_RATES } from "./fallback";
import { readCache, writeCache, isCacheFresh } from "./cache";
import { fetchFreshRates } from "./providers";

export { type DailyEntry, type DailyRates } from "./history";

export async function getExchangeRates(): Promise<RatesData> {
    const now = new Date().toISOString();

    const cached = readCache();

    if (cached && isCacheFresh(cached)) {
        console.log("📦 Sirviendo desde cache (sin consulta a la API)");
        return cached;
    }

    console.log("🔄 Cache expirado o inexistente. Consultando API...");

    try {
        const freshData = await fetchFreshRates();

        if (freshData) {
            writeCache(freshData);
            return freshData;
        }

        if (cached) {
            console.warn("⚠ API falló, usando cache anterior (datos pueden estar desactualizados)");
            return { ...cached, source: "fallback" };
        }

        throw new Error("Sin cache ni API disponible");
    } catch (error) {
        console.error("❌ Error total, usando fallback local:", error);
        const fallbackData: RatesData = { rates: FALLBACK_RATES, fetchedAt: now, source: "fallback" };
        writeCache(fallbackData);
        return fallbackData;
    }
}
