import { RateEntry } from "@/types";
import CurrencyCard from "./CurrencyCard";

interface CurrencyListProps {
    rates: RateEntry[];
}

export default function CurrencyList({ rates }: CurrencyListProps) {
    return (
        <div className="flex flex-col w-full gap-3 pb-10">
            {rates.map((item, index) => (
                <CurrencyCard
                    key={`${item.symbol}-${item.name}`}
                    name={item.name}
                    symbol={item.symbol}
                    rate={item.rate}
                    lastUpdate={item.lastUpdate}
                    index={index}
                />
            ))}
        </div>
    );
}
