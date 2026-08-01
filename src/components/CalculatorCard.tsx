"use client";

import { useCurrencyStore } from "@/store/useCurrencyStore";
import { Plus, Copy, Check } from "lucide-react";
import { useEffect, useState, useCallback, useMemo } from "react";
import { RateEntry } from "@/types";
import CustomRateModal from "./CustomRateModal";
import {
    formatCurrencyInput,
    parseCurrencyInput,
    sanitizeCurrencyInput,
} from "@/lib/currencyInput";

interface CalculatorCardProps {
    rates: RateEntry[];
}

export default function CalculatorCard({ rates: initialRates }: CalculatorCardProps) {
    const {
        setAmounts,
        lastEdited,
        selectedRate,
        setSelectedRate,
        historicalRates,
    } = useCurrencyStore();

    const [mounted, setMounted] = useState(false);
    const [animateIn, setAnimateIn] = useState(false);
    const [rawUsd, setRawUsd] = useState("1");
    const [rawBs, setRawBs] = useState("0.00");
    const [showCustomModal, setShowCustomModal] = useState(false);
    const [allRates, setAllRates] = useState<RateEntry[]>(initialRates);
    const [copiedField, setCopiedField] = useState<"top" | "bs" | null>(null);
    const [focusedField, setFocusedField] = useState<"top" | "bs" | null>(null);

    // Cuando cambian las tasas históricas, actualizar allRates
    useEffect(() => {
        const frame = requestAnimationFrame(() => {
            setAllRates(historicalRates ?? initialRates);
        });
        return () => cancelAnimationFrame(frame);
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
        const frame = requestAnimationFrame(() => setMounted(true));
        const timer = setTimeout(() => setAnimateIn(true), 100);
        return () => { cancelAnimationFrame(frame); clearTimeout(timer); };
    }, []);

    // Recalcular siempre desde el último campo editado.
    useEffect(() => {
        if (!mounted) return;
        if (activeRate <= 0) return;

        const frame = requestAnimationFrame(() => {
            if (lastEdited === "bs") {
                const bs = parseCurrencyInput(rawBs) ?? 0;
                const top = bs / activeRate;
                setRawUsd(top.toFixed(2));
                setAmounts(top, bs, "bs");
                return;
            }

            const top = parseCurrencyInput(rawUsd) ?? 0;
            const bs = top * activeRate;
            setRawBs(bs.toFixed(2));
            setAmounts(top, bs, "usd");
        });

        return () => cancelAnimationFrame(frame);
    }, [activeRate, lastEdited, mounted, rawBs, rawUsd, setAmounts]);

    // Manejar input superior (USD/EUR)
    const handleTopChange = useCallback(
        (rawValue: string) => {
            const clean = sanitizeCurrencyInput(rawValue);
            if (clean === null) return;

            setRawUsd(clean);
            const num = parseCurrencyInput(clean);
            if (num !== null && activeRate > 0) {
                const bs = (num * activeRate).toFixed(2);
                setRawBs(bs);
                setAmounts(num, Number.parseFloat(bs), "usd");
            } else if (clean === "") {
                setRawBs("0.00");
                setAmounts(0, 0, "usd");
            }
        },
        [activeRate, setAmounts]
    );

    // Manejar input inferior (Bs)
    const handleBsChange = useCallback(
        (rawValue: string) => {
            const clean = sanitizeCurrencyInput(rawValue);
            if (clean === null) return;

            setRawBs(clean);
            const num = parseCurrencyInput(clean);
            if (num !== null && activeRate > 0) {
                const top = (num / activeRate).toFixed(2);
                setRawUsd(top);
                setAmounts(Number.parseFloat(top), num, "bs");
            } else if (clean === "") {
                setRawUsd("0.00");
                setAmounts(0, 0, "bs");
            }
        },
        [activeRate, setAmounts]
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
                    {allRates.filter((r) => r.symbol !== "CUSTOM").map((r) => (
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
                                className="w-8 h-8 rounded-full text-xs font-semibold shrink-0
                                   bg-on-primary/15 text-on-primary/80 hover:bg-on-primary/25 active:scale-95
                                   transition-all duration-200 flex items-center justify-center"
                                aria-label="Añadir tasa personalizada"
                                title="Añadir tasa personalizada"
                            >
                                <Plus className="w-3.5 h-3.5" />
                            </button>
                        );
                    })()}
                </div>

                {/* Top Input (USD / EUR) */}
                <div className="flex flex-col gap-1 z-10">
                    <label
                        className="text-[10px] font-bold opacity-60 uppercase tracking-widest ml-1"
                        htmlFor="top-input"
                    >
                        Tengo ({selectedRate === "CUSTOM" ? "Divisa" : selectedRate})
                    </label>
                    <div className="flex items-center gap-2 bg-black/15 rounded-2xl px-4 py-3 border border-white/10">
                        <span className="text-xl font-bold opacity-80">{originSymbol}</span>
                        <input
                            id="top-input"
                            type="text"
                            inputMode="decimal"
                            value={focusedField === "top" ? rawUsd : formatCurrencyInput(rawUsd)}
                            onChange={(e) => handleTopChange(e.target.value)}
                            onFocus={(e) => {
                                setFocusedField("top");
                                e.target.select();
                            }}
                            onBlur={() => setFocusedField(null)}
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
                <div className="flex items-center justify-center z-10 px-1 py-0.5">
                    <span className="text-xs italic font-medium opacity-50">
                        1 {selectedRate === "CUSTOM" ? "Divisa" : selectedRate} = Bs{" "}
                        {formatCurrencyInput(activeRate.toFixed(2))}
                    </span>
                </div>

                {/* Bs Input (Abajo) */}
                <div className="flex flex-col gap-1 z-10">
                    <label
                        className="text-[10px] font-bold opacity-60 uppercase tracking-widest ml-1"
                        htmlFor="bs-input"
                    >
                        Recibo (Bs) — {activeLabel}
                    </label>
                    <div className="flex items-center gap-2 bg-black/15 rounded-2xl px-4 py-3 border border-white/10">
                        <span className="text-xl font-bold opacity-80">Bs</span>
                        <input
                            id="bs-input"
                            type="text"
                            inputMode="decimal"
                            value={focusedField === "bs" ? rawBs : formatCurrencyInput(rawBs)}
                            onChange={(e) => handleBsChange(e.target.value)}
                            onFocus={(e) => {
                                setFocusedField("bs");
                                e.target.select();
                            }}
                            onBlur={() => setFocusedField(null)}
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
