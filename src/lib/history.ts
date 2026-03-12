import fs from "fs";
import { RatesData } from "@/types";
import { HISTORY_FILE, DAILY_FILE } from "./fallback";

interface HistoryEntry {
    date: string;
    usd: number | null;
    eur: number | null;
    usdt: number | null;
}

export interface DailyEntry {
    usd: number;
    eur: number;
    usdt: number;
    date: string;
}

export type DailyRates = Record<string, DailyEntry>;

export function appendHistory(data: RatesData): void {
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

export function updateDailyRecord(data: RatesData): void {
    try {
        const dayKey = data.fetchedAt.slice(0, 10);
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

        daily[dayKey] = entry;
        fs.writeFileSync(DAILY_FILE, JSON.stringify(daily, null, 2), "utf-8");
        console.log(`📅 Registro diario actualizado: ${Object.keys(daily).length} días`);
    } catch (err) {
        console.error("⚠ No se pudo actualizar el registro diario:", err);
    }
}
