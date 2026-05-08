"use client";

import { useCurrencyStore } from "@/store/useCurrencyStore";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { useEffect, useState } from "react";

interface CurrencyCardProps {
    name: string;
    symbol: string;
    rate: number;
    lastUpdate: string;
    index: number; // Para la animación staggered
    previousRate?: number;
}

export default function CurrencyCard({
    name,
    symbol,
    rate,
    lastUpdate,
    index,
    previousRate,
}: CurrencyCardProps) {
    const { baseAmount, bsAmount, lastEdited } = useCurrencyStore();
    const [mounted, setMounted] = useState(false);
    const [animateIn, setAnimateIn] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Delay progresivo para cada tarjeta: 200ms, 350ms, 500ms...
        const timer = setTimeout(() => setAnimateIn(true), 200 + index * 150);
        return () => clearTimeout(timer);
    }, [index]);

    if (!mounted) {
        return (
            <div className="bg-surface text-on-surface rounded-2xl p-4 flex justify-between items-center shadow-sm opacity-0">
                <div className="h-6 w-28 bg-white/5 rounded" />
                <div className="h-6 w-20 bg-white/5 rounded" />
            </div>
        );
    }

    // La conversión se calcula de forma paralela:
    const bsResult = (baseAmount * rate).toLocaleString("es-VE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

    const usdResult =
        rate > 0
            ? (bsAmount / rate).toLocaleString("es-VE", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            })
            : "0.00";

    // Tendencia visual comparada con el día anterior
    let trend: "up" | "down" | "neutral" = "neutral";
    let trendValue = "0.0%";

    if (previousRate && previousRate > 0) {
        const diff = rate - previousRate;
        const percent = (diff / previousRate) * 100;
        
        if (Math.abs(percent) < 0.01) {
            trend = "neutral";
            trendValue = "0.0%";
        } else if (percent > 0) {
            trend = "up";
            trendValue = `+${percent.toFixed(2)}%`;
        } else {
            trend = "down";
            trendValue = `${percent.toFixed(2)}%`;
        }
    }

    // Fecha formateada
    const dateStr = (() => {
        try {
            return new Date(lastUpdate).toLocaleString("es-VE", {
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
            });
        } catch {
            return lastUpdate;
        }
    })();

    return (
        <div
            className={`bg-surface text-on-surface rounded-2xl p-4 flex justify-between items-center shadow-sm
                   transition-all duration-500 active:scale-[0.98] hover:bg-surface-variant/30
                   ${animateIn
                    ? "opacity-100 translate-y-0 scale-100"
                    : "opacity-0 translate-y-6 scale-95"
                }`}
        >
            {/* Izquierda: info de la moneda */}
            <div className="flex flex-col gap-0.5">
                <span className="font-semibold text-base">{name}</span>
                <div className="flex items-center gap-1 text-xs font-medium">
                    {trend === "up" && <TrendingUp className="w-3.5 h-3.5 text-green-400" />}
                    {trend === "down" && <TrendingDown className="w-3.5 h-3.5 text-red-400" />}
                    {trend === "neutral" && <Minus className="w-3.5 h-3.5 text-gray-500" />}
                    <span
                        className={
                            trend === "up"
                                ? "text-green-400"
                                : trend === "down"
                                    ? "text-red-400"
                                    : "text-gray-500"
                        }
                    >
                        {trendValue}
                    </span>
                </div>
                <span className="text-[10px] text-foreground/40 mt-0.5">{dateStr}</span>
            </div>

            {/* Derecha: valores calculados */}
            <div className="flex flex-col items-end gap-0.5">
                {lastEdited === "usd" ? (
                    <>
                        <span className="text-lg font-bold transition-value">
                            Bs {bsResult}
                        </span>
                        <span className="text-xs text-foreground/50">
                            Tasa: {rate.toLocaleString("es-VE", { minimumFractionDigits: 2 })}
                        </span>
                    </>
                ) : (
                    <>
                        <span className="text-lg font-bold transition-value">
                            $ {usdResult}
                        </span>
                        <span className="text-xs text-foreground/50">
                            Tasa: {rate.toLocaleString("es-VE", { minimumFractionDigits: 2 })}
                        </span>
                    </>
                )}
            </div>
        </div>
    );
}
