"use client";

import { useCurrencyStore } from "@/store/useCurrencyStore";
import { Plus, Copy, Check } from "lucide-react";
import { useEffect, useState, useCallback, useMemo } from "react";
import { RateEntry } from "@/types";
import CustomRateModal from "./CustomRateModal";

interface CalculatorCardProps {
    rates: RateEntry[];
}

// ============================================================
// Formatear número con separadores: 41,404.55
// Comas para miles, punto para decimales
// ============================================================
function formatNumber(value: string): string {
    if (!value || value === "0") return "0";

    // Separar parte entera y decimal
    const parts = value.split(".");
    const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    const decPart = parts[1];

    if (decPart !== undefined) {
        return `${intPart}.${decPart}`;
    }
    return intPart;
}

// Quitar formato para obtener el número puro
function unformatNumber(value: string): string {
    return value.replace(/,/g, "");
}

export default function CalculatorCard({ rates: initialRates }: CalculatorCardProps) {
    const {
        setBaseAmount,
        setBsAmount,
        selectedRate,
        setSelectedRate,
        historicalRates,
        historicalDate,
    } = useCurrencyStore();

    const [mounted, setMounted] = useState(false);
    const [animateIn, setAnimateIn] = useState(false);
    const [rawUsd, setRawUsd] = useState("0.00");
    const [rawBs, setRawBs] = useState("0.00");
    const [showCustomModal, setShowCustomModal] = useState(false);
    const [allRates, setAllRates] = useState<RateEntry[]>(initialRates);
    const [copiedField, setCopiedField] = useState<"top" | "bs" | null>(null);

    // Cuando cambian las tasas históricas, actualizar allRates
    useEffect(() => {
        if (historicalRates) {
            setAllRates(historicalRates);
        } else {
            setAllRates(initialRates);
        }
    }, [historicalRates, initialRates]);

    // La tasa activa
    const activeRate = useMemo(
        () => allRates.find((r) => r.symbol === selectedRate)?.rate ?? allRates[0]?.rate ?? 0,
        [allRates, selectedRate]
    );

    // Label dinámico
    const activeLabel = useMemo(() => {
        const entry = allRates.find((r) => r.symbol === selectedRate);
        return entry?.name ?? "Dólar BCV";
    }, [allRates, selectedRate]);

    const originSymbol = useMemo(() => {
        if (selectedRate === "EUR") return "€";
        return "$";
    }, [selectedRate]);

    useEffect(() => {
        setMounted(true);
        const timer = setTimeout(() => setAnimateIn(true), 100);
        return () => clearTimeout(timer);
    }, []);

    // Recalcular cuando cambia la tasa
    useEffect(() => {
        if (!mounted) return;
        const num = parseFloat(rawUsd);
        if (!isNaN(num) && num > 0 && activeRate > 0) {
            const bs = (num * activeRate).toFixed(2);
            setRawBs(bs);
            setBsAmount(parseFloat(bs));
        }
    }, [activeRate, mounted]);

    // Manejar input superior (USD/EUR)
    const handleTopChange = useCallback(
        (rawValue: string) => {
            // Quitar comas del formato
            const clean = unformatNumber(rawValue).replace(/[^0-9.]/g, "");
            const dotCount = (clean.match(/\./g) || []).length;
            if (dotCount > 1) return;

            setRawUsd(clean);
            const num = parseFloat(clean);
            if (!isNaN(num) && num >= 0 && activeRate > 0) {
                setBaseAmount(num);
                const bs = (num * activeRate).toFixed(2);
                setRawBs(bs);
                setBsAmount(parseFloat(bs));
            } else if (clean === "" || clean === "0") {
                setBaseAmount(0);
                setRawBs("0.00");
                setBsAmount(0);
            }
        },
        [activeRate, setBaseAmount, setBsAmount]
    );

    // Manejar input inferior (Bs)
    const handleBsChange = useCallback(
        (rawValue: string) => {
            const clean = unformatNumber(rawValue).replace(/[^0-9.]/g, "");
            const dotCount = (clean.match(/\./g) || []).length;
            if (dotCount > 1) return;

            setRawBs(clean);
            const num = parseFloat(clean);
            if (!isNaN(num) && num >= 0 && activeRate > 0) {
                setBsAmount(num);
                const top = (num / activeRate).toFixed(2);
                setRawUsd(top);
                setBaseAmount(parseFloat(top));
            } else if (clean === "" || clean === "0") {
                setBsAmount(0);
                setRawUsd("1.00");
                setBaseAmount(0);
            }
        },
        [activeRate, setBaseAmount, setBsAmount]
    );

    // Copiar monto al portapapeles
    const handleCopy = useCallback(async (field: "top" | "bs") => {
        const value = field === "top" ? rawUsd : rawBs;
        try {
            await navigator.clipboard.writeText(value);
            setCopiedField(field);
            setTimeout(() => setCopiedField(null), 1500);
        } catch { /* clipboard no disponible */ }
    }, [rawUsd, rawBs]);

    // Tasa personalizada
    const handleSaveCustomRate = useCallback(
        (name: string, rate: number) => {
            const customSymbol = "CUSTOM";
            setAllRates((prev) => {
                const withoutOldCustom = prev.filter((r) => r.symbol !== customSymbol);
                return [
                    ...withoutOldCustom,
                    { name, symbol: customSymbol, rate, lastUpdate: new Date().toISOString() },
                ];
            });
            setSelectedRate(customSymbol);
        },
        [setSelectedRate]
    );

    if (!mounted) {
        return (
            <div className="bg-primary text-on-primary rounded-3xl p-6 shadow-lg mb-6 opacity-0">
                <div className="h-40 w-full bg-black/10 rounded-xl"></div>
            </div>
        );
    }

    return (
        <>
            <div className={`bg-primary text-on-primary rounded-3xl p-5 shadow-xl mb-6 flex flex-col gap-2 relative overflow-hidden
                    transition-all duration-600 ease-out
                    ${animateIn ? "opacity-100 translate-y-0 scale-100" : "opacity-0 -translate-y-8 scale-95"}`}>
                {/* Decorative blobs */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 blur-3xl rounded-full -mr-12 -mt-12 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 blur-2xl rounded-full -ml-8 -mb-8 pointer-events-none" />

                {/* Rate Selector Chips */}
                <div className="flex gap-2 z-10 mb-1 overflow-x-auto pb-1 scrollbar-none">
                    {allRates.map((r) => (
                        <button
                            key={r.symbol}
                            onClick={() => setSelectedRate(r.symbol)}
                            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200
                                ${selectedRate === r.symbol
                                    ? "bg-on-primary text-primary shadow-md scale-105"
                                    : "bg-on-primary/15 text-on-primary/80 hover:bg-on-primary/25 active:scale-95"
                                }`}
                        >
                            {r.name}
                        </button>
                    ))}
                    {/* Chip Personalizada */}
                    {(() => {
                        const customRate = allRates.find((r) => r.symbol === "CUSTOM");
                        if (customRate) {
                            return (
                                <button
                                    key="CUSTOM"
                                    onClick={() => {
                                        if (selectedRate === "CUSTOM") setShowCustomModal(true);
                                        else setSelectedRate("CUSTOM");
                                    }}
                                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200
                                        ${selectedRate === "CUSTOM"
                                            ? "bg-on-primary text-primary shadow-md scale-105"
                                            : "bg-on-primary/15 text-on-primary/80 hover:bg-on-primary/25 active:scale-95"
                                        }`}
                                >
                                    {customRate.name}
                                </button>
                            );
                        }
                        return (
                            <button
                                onClick={() => setShowCustomModal(true)}
                                className="px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap
                                   bg-on-primary/15 text-on-primary/80 hover:bg-on-primary/25 active:scale-95
                                   transition-all duration-200 flex items-center gap-1"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                Personalizada
                            </button>
                        );
                    })()}
                </div>

                {/* Top Input (USD / EUR) */}
                <div className="flex flex-col gap-1 z-10">
                    <label
                        className="text-xs font-semibold opacity-70 uppercase tracking-wider"
                        htmlFor="top-input"
                    >
                        Tengo ({selectedRate === "CUSTOM" ? "Divisa" : selectedRate})
                    </label>
                    <div className="flex items-center gap-2 bg-on-primary/10 rounded-2xl px-4 py-3">
                        <span className="text-xl font-bold opacity-80">{originSymbol}</span>
                        <input
                            id="top-input"
                            type="text"
                            inputMode="decimal"
                            value={formatNumber(rawUsd)}
                            onChange={(e) => handleTopChange(e.target.value)}
                            onFocus={(e) => e.target.select()}
                            className="bg-transparent border-none outline-none w-full text-3xl font-bold p-0 text-on-primary placeholder:text-on-primary/40"
                            placeholder="0.00"
                        />
                        <button
                            onClick={() => handleCopy("top")}
                            className="flex-shrink-0 w-8 h-8 rounded-full bg-on-primary/10 flex items-center justify-center
                                       hover:bg-on-primary/20 active:scale-90 transition-all duration-150"
                            aria-label="Copiar monto"
                        >
                            {copiedField === "top" ? (
                                <Check className="w-3.5 h-3.5 text-on-primary" />
                            ) : (
                                <Copy className="w-3.5 h-3.5 text-on-primary/70" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Rate label (sin swap) */}
                <div className="flex items-center justify-center z-10 px-1">
                    <span className="text-[11px] font-medium opacity-60">
                        1 {selectedRate === "CUSTOM" ? "Divisa" : selectedRate} = Bs{" "}
                        {formatNumber(activeRate.toFixed(2))}
                    </span>
                </div>

                {/* Bs Input (Abajo) */}
                <div className="flex flex-col gap-1 z-10">
                    <label
                        className="text-xs font-semibold opacity-70 uppercase tracking-wider"
                        htmlFor="bs-input"
                    >
                        Recibo (Bs) — {activeLabel}
                    </label>
                    <div className="flex items-center gap-2 bg-on-primary/10 rounded-2xl px-4 py-3">
                        <span className="text-xl font-bold opacity-80">Bs</span>
                        <input
                            id="bs-input"
                            type="text"
                            inputMode="decimal"
                            value={formatNumber(rawBs)}
                            onChange={(e) => handleBsChange(e.target.value)}
                            onFocus={(e) => e.target.select()}
                            className="bg-transparent border-none outline-none w-full text-3xl font-bold p-0 text-on-primary placeholder:text-on-primary/40"
                            placeholder="0.00"
                        />
                        <button
                            onClick={() => handleCopy("bs")}
                            className="flex-shrink-0 w-8 h-8 rounded-full bg-on-primary/10 flex items-center justify-center
                                       hover:bg-on-primary/20 active:scale-90 transition-all duration-150"
                            aria-label="Copiar monto"
                        >
                            {copiedField === "bs" ? (
                                <Check className="w-3.5 h-3.5 text-on-primary" />
                            ) : (
                                <Copy className="w-3.5 h-3.5 text-on-primary/70" />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <CustomRateModal
                open={showCustomModal}
                onClose={() => setShowCustomModal(false)}
                onSave={handleSaveCustomRate}
            />
        </>
    );
}
