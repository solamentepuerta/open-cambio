import fs from "fs";
import path from "path";
import { RatesData } from "@/types";
import { CACHE_FILE, CACHE_DURATION_MS } from "./fallback";
import { appendHistory, updateDailyRecord } from "./history";

export function readCache(): RatesData | null {
    try {
        if (!fs.existsSync(CACHE_FILE)) return null;
        const raw = fs.readFileSync(CACHE_FILE, "utf-8");
        return JSON.parse(raw) as RatesData;
    } catch {
        return null;
    }
}

export function writeCache(data: RatesData): void {
    try {
        const dir = path.dirname(CACHE_FILE);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2), "utf-8");
        console.log("💾 Cache actualizado:", CACHE_FILE);

        appendHistory(data);
        updateDailyRecord(data);
    } catch (err) {
        console.error("⚠ No se pudo escribir el cache:", err);
    }
}

export function isCacheFresh(data: RatesData): boolean {
    const cachedTime = new Date(data.fetchedAt).getTime();
    const now = Date.now();
    const ageMs = now - cachedTime;
    const ageHours = (ageMs / (1000 * 60 * 60)).toFixed(1);
    console.log(`🕐 Cache tiene ${ageHours}h de antigüedad (máx: 8h)`);
    return ageMs < CACHE_DURATION_MS;
}
