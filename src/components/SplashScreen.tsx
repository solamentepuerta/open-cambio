"use client";

import Image from "next/image";
import { useState, useEffect } from "react";

export default function SplashScreen() {
    const [visible, setVisible] = useState(true);
    const [fadeOut, setFadeOut] = useState(false);

    useEffect(() => {
        // Comenzar fade-out después de 1.5s
        const fadeTimer = setTimeout(() => setFadeOut(true), 1500);
        // Remover del DOM después de la animación
        const removeTimer = setTimeout(() => setVisible(false), 2100);
        return () => {
            clearTimeout(fadeTimer);
            clearTimeout(removeTimer);
        };
    }, []);

    if (!visible) return null;

    return (
        <div
            className={`fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center
                transition-opacity duration-500 ease-out ${fadeOut ? "opacity-0" : "opacity-100"}`}
        >
            {/* Logo girando contra las manecillas del reloj */}
            <div className="animate-spin-ccw">
                <Image
                    src="/icons/android-chrome-192x192.png"
                    alt="Vex logo"
                    width={80}
                    height={80}
                    className="rounded-3xl"
                    priority
                />
            </div>
            <h1 className="mt-5 text-2xl font-bold font-display text-foreground animate-[fadeIn_0.5s_ease_0.3s_both]">
                Vex
            </h1>
            <p className="mt-1 text-xs text-foreground/40 tracking-widest uppercase animate-[fadeIn_0.5s_ease_0.5s_both]">
                Tasa libre de Venezuela
            </p>
        </div>
    );
}
