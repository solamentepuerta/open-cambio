"use client";

import { useTheme } from "./ThemeProvider";
import { Sun, Moon, X, Palette } from "lucide-react";
import { useState, useCallback, useEffect } from "react";

export default function SettingsPanel() {
    const { mode, toggleMode, colorKey, setColorKey, presets } = useTheme();
    const [open, setOpen] = useState(false);
    const [visible, setVisible] = useState(false);
    const [animatingOut, setAnimatingOut] = useState(false);

    // Animate in
    useEffect(() => {
        if (open) {
            requestAnimationFrame(() => setVisible(true));
        }
    }, [open]);

    // Animate out
    const handleClose = useCallback(() => {
        setAnimatingOut(true);
        setVisible(false);
        setTimeout(() => {
            setAnimatingOut(false);
            setOpen(false);
        }, 280);
    }, []);

    const handleOpen = useCallback(() => {
        setOpen(true);
    }, []);

    return (
        <>
            {/* Trigger button */}
            <button
                onClick={handleOpen}
                className="fixed bottom-5 right-5 z-40 w-12 h-12 rounded-full bg-surface text-on-surface shadow-lg
                   flex items-center justify-center hover:scale-110 active:scale-95 transition-transform duration-200
                   border border-white/10"
                aria-label="Opciones"
            >
                <Palette className="w-5 h-5" />
            </button>

            {/* Backdrop + Panel */}
            {(open || animatingOut) && (
                <div
                    className="fixed inset-0 z-50 flex items-end justify-center"
                    onClick={handleClose}
                >
                    {/* Scrim */}
                    <div
                        className={`absolute inset-0 bg-black/50 transition-opacity duration-280 ease-out
              ${visible ? "opacity-100" : "opacity-0"}`}
                    />

                    {/* Bottom sheet */}
                    <div
                        className={`relative w-full max-w-md bg-surface rounded-t-3xl p-6 pt-4 z-10
              transition-all duration-300 ease-[cubic-bezier(0.2,0,0,1)]
              ${visible
                                ? "opacity-100 translate-y-0"
                                : "opacity-0 translate-y-full"
                            }`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Handle bar */}
                        <div className="flex justify-center mb-3">
                            <div className="w-10 h-1 rounded-full bg-on-surface/20" />
                        </div>

                        {/* Close */}
                        <button
                            onClick={handleClose}
                            className="absolute top-4 right-4 w-8 h-8 rounded-full hover:bg-on-surface/10 flex items-center justify-center transition-colors"
                            aria-label="Cerrar opciones"
                        >
                            <X className="w-4 h-4 text-on-surface/60" />
                        </button>

                        <h3 className="text-lg font-bold text-on-surface mb-5">Opciones</h3>

                        {/* Modo claro / oscuro */}
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                {mode === "dark" ? (
                                    <Moon className="w-5 h-5 text-on-surface/70" />
                                ) : (
                                    <Sun className="w-5 h-5 text-on-surface/70" />
                                )}
                                <span className="text-sm font-medium text-on-surface">
                                    {mode === "dark" ? "Modo oscuro" : "Modo claro"}
                                </span>
                            </div>
                            <button
                                onClick={toggleMode}
                                className={`w-12 h-7 rounded-full relative transition-colors duration-300 ${mode === "dark" ? "bg-primary" : "bg-on-surface/20"
                                    }`}
                            >
                                <div
                                    className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform duration-300 ${mode === "dark" ? "translate-x-5" : "translate-x-0.5"
                                        }`}
                                />
                            </button>
                        </div>

                        {/* Color picker */}
                        <div className="mb-2">
                            <span className="text-sm font-medium text-on-surface/70 mb-3 block">
                                Color de acento
                            </span>
                            <div className="flex gap-3 flex-wrap">
                                {Object.entries(presets).map(([key, colors]) => (
                                    <button
                                        key={key}
                                        onClick={() => setColorKey(key)}
                                        className={`w-10 h-10 rounded-full transition-all duration-200 ${colorKey === key
                                            ? "ring-2 ring-offset-2 ring-offset-surface scale-110"
                                            : "hover:scale-105"
                                            }`}
                                        style={{
                                            backgroundColor: colors.primary,
                                        }}
                                        aria-label={`Color ${key}`}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
