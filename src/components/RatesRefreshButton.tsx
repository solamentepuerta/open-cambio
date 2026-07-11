"use client";

import { Check, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type RefreshStatus = "idle" | "loading" | "success" | "error";

function formatRemaining(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

export default function RatesRefreshButton() {
  const router = useRouter();
  const [status, setStatus] = useState<RefreshStatus>("idle");
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/rates/refresh", { signal: controller.signal })
      .then((response) => response.json())
      .then((data: { retryAfter?: number }) => setRemaining(Math.max(0, data.retryAfter ?? 0)))
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (remaining <= 0) return;
    const timer = setInterval(() => setRemaining((value) => Math.max(0, value - 1)), 1000);
    return () => clearInterval(timer);
  }, [remaining]);

  const refresh = useCallback(async () => {
    if (remaining > 0 || status === "loading") return;
    setStatus("loading");
    try {
      const response = await fetch("/api/rates/refresh", { method: "POST" });
      const data = (await response.json()) as { retryAfter?: number };
      setRemaining(Math.max(0, data.retryAfter ?? 300));
      if (!response.ok) throw new Error("refresh failed");
      setStatus("success");
      router.refresh();
      setTimeout(() => setStatus("idle"), 2200);
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 2500);
    }
  }, [remaining, router, status]);

  const label = status === "loading"
    ? "Consultando al BCV…"
    : status === "success"
      ? "Tasas actualizadas"
      : status === "error"
        ? "Intenta nuevamente"
        : remaining > 0
          ? `Disponible en ${formatRemaining(remaining)}`
          : "Actualizar tasas";

  return (
    <button
      type="button"
      onClick={refresh}
      disabled={remaining > 0 || status === "loading"}
      className={`group relative mt-1.5 inline-flex items-center gap-1.5 overflow-hidden rounded-full px-2.5 py-1 text-[10px] font-semibold transition-all
        ${status === "loading" ? "bg-primary/20 text-primary ring-1 ring-primary/40" : "bg-surface text-foreground/60 hover:text-primary"}
        disabled:cursor-not-allowed disabled:opacity-70`}
      aria-live="polite"
    >
      {status === "loading" && <span className="absolute inset-0 animate-[refreshSweep_1.2s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-primary/20 to-transparent" />}
      {status === "success" ? <Check className="relative w-3 h-3" /> : <RefreshCw className={`relative w-3 h-3 ${status === "loading" ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"}`} />}
      <span className="relative">{label}</span>
    </button>
  );
}
