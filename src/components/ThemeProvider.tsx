"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type ThemeMode = "dark" | "light";

interface ThemeColors {
    primary: string;
    onPrimary: string;
}

const COLOR_PRESETS: Record<string, ThemeColors> = {
    green: { primary: "#82E03A", onPrimary: "#00390A" },
    blue: { primary: "#6AB7FF", onPrimary: "#00315B" },
    violet: { primary: "#C77DFF", onPrimary: "#2D004F" },
    orange: { primary: "#FFB74D", onPrimary: "#3E2100" },
    pink: { primary: "#F48FB1", onPrimary: "#4A0020" },
    cyan: { primary: "#4DD0E1", onPrimary: "#003740" },
};

interface ThemeContextType {
    mode: ThemeMode;
    toggleMode: () => void;
    colorKey: string;
    setColorKey: (key: string) => void;
    presets: typeof COLOR_PRESETS;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function useTheme() {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
    return ctx;
}

export default function ThemeProvider({ children }: { children: ReactNode }) {
    const [mode, setMode] = useState<ThemeMode>("dark");
    const [colorKey, setColorKey] = useState("green");
    const [hydrated, setHydrated] = useState(false);

    // Cargar preferencias del localStorage
    useEffect(() => {
        const savedMode = localStorage.getItem("oc-theme-mode") as ThemeMode | null;
        const savedColor = localStorage.getItem("oc-theme-color");
        if (savedMode) setMode(savedMode);
        if (savedColor && COLOR_PRESETS[savedColor]) setColorKey(savedColor);
        setHydrated(true);
    }, []);

    // Aplicar CSS Variables al <html>
    useEffect(() => {
        if (!hydrated) return;
        const root = document.documentElement;
        const colors = COLOR_PRESETS[colorKey] ?? COLOR_PRESETS.green;

        if (mode === "dark") {
            root.style.setProperty("--color-background", "#1C1B1F");
            root.style.setProperty("--color-foreground", "#E6E1E5");
            root.style.setProperty("--color-surface", "#2B2B2D");
            root.style.setProperty("--color-on-surface", "#E6E1E5");
            root.style.setProperty("--color-surface-variant", "#49454F");
            root.style.colorScheme = "dark";
        } else {
            root.style.setProperty("--color-background", "#FFFBFE");
            root.style.setProperty("--color-foreground", "#1C1B1F");
            root.style.setProperty("--color-surface", "#F3EDF7");
            root.style.setProperty("--color-on-surface", "#1C1B1F");
            root.style.setProperty("--color-surface-variant", "#E7E0EC");
            root.style.colorScheme = "light";
        }

        root.style.setProperty("--color-primary", colors.primary);
        root.style.setProperty("--color-on-primary", colors.onPrimary);

        localStorage.setItem("oc-theme-mode", mode);
        localStorage.setItem("oc-theme-color", colorKey);
    }, [mode, colorKey, hydrated]);

    const toggleMode = () => setMode((m) => (m === "dark" ? "light" : "dark"));

    return (
        <ThemeContext.Provider value={{ mode, toggleMode, colorKey, setColorKey, presets: COLOR_PRESETS }}>
            {children}
        </ThemeContext.Provider>
    );
}
