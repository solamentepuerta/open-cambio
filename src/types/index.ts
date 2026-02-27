export interface RateEntry {
    name: string;
    symbol: string;
    rate: number; // Tasa en Bolívares
    lastUpdate: string;
}

export interface RatesData {
    rates: RateEntry[];
    fetchedAt: string;
    source: "api" | "fallback";
}
