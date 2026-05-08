import { RateEntry } from "@/types";
import { DailyEntry } from "@/lib/api";
import CurrencyCard from "./CurrencyCard";

interface CurrencyListProps {
    rates: RateEntry[];
    previousRates?: DailyEntry | null;
}

export default function CurrencyList({ rates, previousRates }: CurrencyListProps) {
    return (
        <div className="flex flex-col w-full gap-3 pb-10">
            {rates.map((item, index) => {
                const prevSymbol = item.symbol.toLowerCase() as keyof DailyEntry;
                const prevRate = previousRates ? (previousRates[prevSymbol] as number) : undefined;
                
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
