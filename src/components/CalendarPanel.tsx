"use client";

import { useCurrencyStore } from "@/store/useCurrencyStore";
import { CalendarDays, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { RateEntry } from "@/types";

interface DailyEntry {
    usd: number;
    eur: number;
    usdt: number;
    date: string;
}
type DailyRates = Record<string, DailyEntry>;

export default function CalendarPanel() {
    const { historicalDate, setHistoricalRates } = useCurrencyStore();
    const [open, setOpen] = useState(false);
    const [animatingOut, setAnimatingOut] = useState(false);
    const [dailyRates, setDailyRates] = useState<DailyRates>({});
    const [loaded, setLoaded] = useState(false);

    // Mes/año que se muestra en el calendario
    const today = new Date();
    const [viewMonth, setViewMonth] = useState(today.getMonth());
    const [viewYear, setViewYear] = useState(today.getFullYear());

    // Cargar datos al abrir por primera vez
    useEffect(() => {
        if (open && !loaded) {
            fetch("/api/daily-rates")
                .then((res) => res.json())
                .then((data: DailyRates) => {
                    setDailyRates(data);
                    setLoaded(true);
                })
                .catch(() => setLoaded(true));
        }
    }, [open, loaded]);

    const handleClose = useCallback(() => {
        setAnimatingOut(true);
        setTimeout(() => {
            setOpen(false);
            setAnimatingOut(false);
        }, 200);
    }, []);

    const handleSelectDate = useCallback(
        (dateKey: string) => {
            const entry = dailyRates[dateKey];
            if (!entry) return;

            const rates: RateEntry[] = [
                { name: "Dólar BCV", symbol: "USD", rate: entry.usd, lastUpdate: entry.date },
                { name: "Euro BCV", symbol: "EUR", rate: entry.eur, lastUpdate: entry.date },
                { name: "USDT", symbol: "USDT", rate: entry.usdt, lastUpdate: entry.date },
            ];
            setHistoricalRates(rates, dateKey);
            handleClose();
        },
        [dailyRates, setHistoricalRates, handleClose]
    );

    const handleClearHistory = useCallback(() => {
        setHistoricalRates(null, null);
        handleClose();
    }, [setHistoricalRates, handleClose]);

    // Días disponibles (que tienen datos)
    const availableDates = new Set(Object.keys(dailyRates));

    // Generar el calendario del mes
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0=Dom
    const monthName = new Date(viewYear, viewMonth).toLocaleString("es-VE", { month: "long" });

    const calendarDays: (number | null)[] = [];
    for (let i = 0; i < firstDayOfWeek; i++) calendarDays.push(null);
    for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

    const prevMonth = () => {
        if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
        else setViewMonth(viewMonth - 1);
    };

    const nextMonth = () => {
        if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
        else setViewMonth(viewMonth + 1);
    };

    if (!open) {
        return (
            <button
                onClick={() => setOpen(true)}
                className="fixed bottom-[4.5rem] right-5 z-40 w-12 h-12 rounded-full bg-surface text-foreground shadow-lg
                           flex items-center justify-center hover:bg-surface-variant/50 active:scale-90
                           transition-all duration-200 border border-white/10"
                aria-label="Calendario de tasas"
            >
                <CalendarDays className="w-5 h-5" />
                {historicalDate && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full" />
                )}
            </button>
        );
    }

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 z-50 bg-black/60 ${animatingOut ? "animate-[fadeIn_0.2s_ease_reverse_both]" : "animate-[fadeIn_0.2s_ease_both]"}`}
                onClick={handleClose}
            />

            {/* Panel */}
            <div
                className={`fixed bottom-0 left-0 right-0 z-50 bg-surface text-on-surface rounded-t-3xl shadow-2xl max-h-[85vh] overflow-y-auto
                    ${animatingOut ? "animate-[slideUp_0.2s_ease_reverse_both]" : "animate-[slideUp_0.3s_cubic-bezier(0.2,0,0,1)_both]"}`}
            >
                <div className="p-5 max-w-md mx-auto">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold font-display">Historial de tasas</h2>
                        <button
                            onClick={handleClose}
                            className="w-8 h-8 rounded-full bg-surface-variant/30 flex items-center justify-center hover:bg-surface-variant/50"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Volver a hoy */}
                    {historicalDate && (
                        <button
                            onClick={handleClearHistory}
                            className="w-full mb-4 py-2.5 rounded-xl bg-primary/15 text-primary text-sm font-semibold
                                       hover:bg-primary/25 active:scale-[0.98] transition-all"
                        >
                            ← Volver a tasas de hoy
                        </button>
                    )}

                    {/* Month navigation */}
                    <div className="flex items-center justify-between mb-3">
                        <button onClick={prevMonth} className="w-8 h-8 rounded-full hover:bg-surface-variant/30 flex items-center justify-center">
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-sm font-semibold capitalize">
                            {monthName} {viewYear}
                        </span>
                        <button onClick={nextMonth} className="w-8 h-8 rounded-full hover:bg-surface-variant/30 flex items-center justify-center">
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Day headers */}
                    <div className="grid grid-cols-7 gap-1 mb-1">
                        {["D", "L", "M", "M", "J", "V", "S"].map((d, i) => (
                            <div key={i} className="text-center text-[10px] text-foreground/40 font-medium py-1">{d}</div>
                        ))}
                    </div>

                    {/* Calendar grid */}
                    <div className="grid grid-cols-7 gap-1">
                        {calendarDays.map((day, i) => {
                            if (day === null) return <div key={`empty-${i}`} />;

                            const dateKey = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                            const hasData = availableDates.has(dateKey);
                            const isSelected = historicalDate === dateKey;
                            const isToday = dateKey === today.toISOString().slice(0, 10);

                            return (
                                <button
                                    key={dateKey}
                                    onClick={() => hasData && handleSelectDate(dateKey)}
                                    disabled={!hasData}
                                    className={`aspect-square rounded-xl text-sm font-medium flex items-center justify-center transition-all duration-150
                                        ${isSelected
                                            ? "bg-primary text-on-primary scale-110 shadow-md"
                                            : isToday
                                                ? "ring-1 ring-primary/50 text-primary"
                                                : hasData
                                                    ? "hover:bg-surface-variant/40 text-foreground cursor-pointer active:scale-90"
                                                    : "text-foreground/15 cursor-default"
                                        }`}
                                >
                                    {day}
                                    {hasData && !isSelected && (
                                        <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-primary/60" />
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Selected date info */}
                    {historicalDate && dailyRates[historicalDate] && (
                        <div className="mt-4 p-3 rounded-2xl bg-surface-variant/20 space-y-1">
                            <p className="text-xs text-foreground/50 uppercase tracking-wider font-semibold">
                                Tasas del {new Date(historicalDate + "T12:00:00").toLocaleDateString("es-VE", { day: "2-digit", month: "long", year: "numeric" })}
                            </p>
                            <div className="grid grid-cols-3 gap-2 mt-2">
                                <div className="text-center">
                                    <p className="text-[10px] text-foreground/40">USD BCV</p>
                                    <p className="text-sm font-bold">{dailyRates[historicalDate].usd.toFixed(2)}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-[10px] text-foreground/40">EUR BCV</p>
                                    <p className="text-sm font-bold">{dailyRates[historicalDate].eur.toFixed(2)}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-[10px] text-foreground/40">USDT</p>
                                    <p className="text-sm font-bold">{dailyRates[historicalDate].usdt.toFixed(2)}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
