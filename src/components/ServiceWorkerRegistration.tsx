"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegistration() {
    useEffect(() => {
        if ("serviceWorker" in navigator) {
            navigator.serviceWorker
                .register("/sw.js")
                .then((registration) => {
                    console.log("✅ Service Worker registrado:", registration.scope);
                })
                .catch((error) => {
                    console.warn("⚠ Error registrando Service Worker:", error);
                });
        }
    }, []);

    return null; // Este componente no renderiza nada
}
