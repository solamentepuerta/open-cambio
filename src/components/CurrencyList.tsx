import { DailyEntry, RateEntry } from "@/types";
import CurrencyCard from "./CurrencyCard";

interface CurrencyListProps {
    rates: RateEntry[];
    previousRates?: DailyEntry | null;
}

export default function CurrencyList({ rates, previousRates }: CurrencyListProps) {
    return (
        <div className="flex flex-col w-full gap-3 pb-10">
            {rates.map((item, index) => {
                const prevSymbol = item.symbol.toLowerCase();
                const prevRate =
                    previousRates && ["usd", "eur", "usdt"].includes(prevSymbol)
                        ? previousRates[prevSymbol as "usd" | "eur" | "usdt"]
                        : undefined;
                
                return (
                    <CurrencyCard
                        key={`${item.symbol}-${item.name}`}
                        name={item.name}
                        symbol={item.symbol}
                        rate={item.rate}
                        lastUpdate={item.lastUpdate}
                        index={index}
                        previousRate={prevRate}
                    />
                );
            })}
        </div>
    );
}
