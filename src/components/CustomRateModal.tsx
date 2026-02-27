"use client";

import { X } from "lucide-react";
import { useState, useCallback, useEffect, useRef } from "react";

interface CustomRateModalProps {
    open: boolean;
    onClose: () => void;
    onSave: (name: string, rate: number) => void;
}

export default function CustomRateModal({ open, onClose, onSave }: CustomRateModalProps) {
    const [name, setName] = useState("Personalizada");
    const [rateStr, setRateStr] = useState("");
    const [visible, setVisible] = useState(false);
    const [animatingOut, setAnimatingOut] = useState(false);
    const dialogRef = useRef<HTMLDivElement>(null);

    // Animate in
    useEffect(() => {
        if (open) {
            // Small delay to trigger CSS transition
            requestAnimationFrame(() => setVisible(true));
        }
    }, [open]);

    // Animate out
    const handleClose = useCallback(() => {
        setAnimatingOut(true);
        setVisible(false);
        setTimeout(() => {
            setAnimatingOut(false);
            onClose();
        }, 250);
    }, [onClose]);

    const handleSave = useCallback(() => {
        const rate = parseFloat(rateStr);
        if (!isNaN(rate) && rate > 0) {
            onSave(name.trim() || "Personalizada", rate);
            handleClose();
        }
    }, [name, rateStr, onSave, handleClose]);

    // Filtrar entrada: solo números y punto decimal
    const handleRateInput = (value: string) => {
        const filtered = value.replace(/[^0-9.]/g, "");
        const parts = filtered.split(".");
        if (parts.length > 2) return;
        setRateStr(filtered);
    };

    if (!open && !animatingOut) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            onClick={handleClose}
        >
            {/* Scrim */}
            <div
                className={`absolute inset-0 bg-black/60 transition-opacity duration-250 ease-out
          ${visible ? "opacity-100" : "opacity-0"}`}
            />

            {/* Dialog */}
            <div
                ref={dialogRef}
                className={`relative w-full max-w-sm bg-surface rounded-3xl p-6 z-10
          transition-all duration-300 ease-[cubic-bezier(0.2,0,0,1)]
          ${visible
                        ? "opacity-100 translate-y-0 scale-100"
                        : "opacity-0 translate-y-8 scale-95"
                    }`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close */}
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 w-8 h-8 rounded-full hover:bg-on-surface/10 flex items-center justify-center transition-colors"
                    aria-label="Cerrar"
                >
                    <X className="w-4 h-4 text-on-surface/60" />
                </button>

                <h3 className="text-lg font-bold text-on-surface mb-5">Tasa personalizada</h3>

                {/* Nombre */}
                <div className="flex flex-col gap-1.5 mb-4">
                    <label className="text-xs font-semibold text-on-surface/60 uppercase tracking-wider">
                        Nombre
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-background text-on-surface rounded-xl px-4 py-3 text-sm font-medium
                       border border-on-surface/10 focus:border-primary focus:outline-none transition-colors"
                        placeholder="Ej: Dólar Paralelo"
                    />
                </div>

                {/* Tasa */}
                <div className="flex flex-col gap-1.5 mb-6">
                    <label className="text-xs font-semibold text-on-surface/60 uppercase tracking-wider">
                        Tasa (Bs por unidad)
                    </label>
                    <input
                        type="text"
                        inputMode="decimal"
                        value={rateStr}
                        onChange={(e) => handleRateInput(e.target.value)}
                        className="w-full bg-background text-on-surface rounded-xl px-4 py-3 text-2xl font-bold
                       border border-on-surface/10 focus:border-primary focus:outline-none transition-colors"
                        placeholder="0.00"
                        autoFocus
                    />
                </div>

                {/* Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={handleClose}
                        className="flex-1 py-3 rounded-xl text-sm font-semibold text-on-surface/70 bg-on-surface/5
                       hover:bg-on-surface/10 active:scale-[0.98] transition-all"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!rateStr || parseFloat(rateStr) <= 0}
                        className="flex-1 py-3 rounded-xl text-sm font-semibold bg-primary text-on-primary
                       hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        Guardar
                    </button>
                </div>
            </div>
        </div>
    );
}
