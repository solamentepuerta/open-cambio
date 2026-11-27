"use client";

import { Code2, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const ANNOUNCEMENT_KEY = "announcement_scraper_update_2026_11";

export default function AnnouncementPopup() {
  const [show, setShow] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!localStorage.getItem(ANNOUNCEMENT_KEY)) setShow(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const close = () => {
    setIsClosing(true);
    setTimeout(() => {
      setShow(false);
      localStorage.setItem(ANNOUNCEMENT_KEY, "true");
    }, 400);
  };

  const dismiss = () => {
    localStorage.setItem(ANNOUNCEMENT_KEY, "true");
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-24 left-0 right-0 z-40 flex justify-center px-4 pointer-events-none">
      <div className={`relative bg-surface/90 backdrop-blur-xl text-on-surface rounded-3xl p-5 shadow-2xl max-w-sm w-full pointer-events-auto border border-white/15 transition-all duration-500 ease-out ${isClosing ? "translate-y-8 opacity-0 scale-95" : "translate-y-0 opacity-100 scale-100 animate-[slideUp_0.5s_cubic-bezier(0.2,0,0,1)_both]"}`}>
        <button onClick={close} className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors" aria-label="Cerrar mensaje">
          <X className="w-4 h-4 opacity-70" />
        </button>
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 shrink-0 bg-primary/20 text-primary rounded-full flex items-center justify-center mt-0.5">
            <Code2 className="w-5 h-5" />
          </div>
          <div className="flex-1 pt-0.5">
            <h3 className="text-sm font-bold font-display mb-1.5 text-foreground/90 pr-5">Actualización del scraper BCV</h3>
            <div className="text-xs text-foreground/70 space-y-2 leading-relaxed">
              <p>Corregimos la recolección de tasas y recuperamos el historial del 19 al 26 de noviembre con datos oficiales del BCV.</p>
              <p>Gracias a quienes reportaron el fallo y aportaron mejoras. Ahora el recolector PHP está documentado para que cualquiera pueda reutilizarlo.</p>
            </div>
            <Link
              href="/docs/scraper"
              onClick={dismiss}
              className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:text-primary/80 transition-colors uppercase tracking-wider"
            >
              Ver documentación del scraper →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
