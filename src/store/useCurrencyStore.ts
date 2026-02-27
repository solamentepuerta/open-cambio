import { create } from "zustand";
import { RateEntry } from "@/types";

interface CurrencyState {
    baseAmount: number;
    bsAmount: number;
    lastEdited: "usd" | "bs";
    selectedRate: string;
    // Tasas históricas: si no es null, sobrescribe las tasas actuales
    historicalRates: RateEntry[] | null;
    historicalDate: string | null; // "YYYY-MM-DD" o null para hoy
    setBaseAmount: (amount: number) => void;
    setBsAmount: (amount: number) => void;
    setSelectedRate: (symbol: string) => void;
    setHistoricalRates: (rates: RateEntry[] | null, date: string | null) => void;
}

export const useCurrencyStore = create<CurrencyState>((set) => ({
    baseAmount: 1,
    bsAmount: 0,
    lastEdited: "usd",
    selectedRate: "USD",
    historicalRates: null,
    historicalDate: null,
    setBaseAmount: (amount) => set({ baseAmount: amount, lastEdited: "usd" }),
    setBsAmount: (amount) => set({ bsAmount: amount, lastEdited: "bs" }),
    setSelectedRate: (symbol) => set({ selectedRate: symbol }),
    setHistoricalRates: (rates, date) => set({ historicalRates: rates, historicalDate: date }),
}));
