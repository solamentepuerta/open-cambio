import Header from "@/components/Header";
import CalculatorCard from "@/components/CalculatorCard";
import CurrencyList from "@/components/CurrencyList";
import Footer from "@/components/Footer";
import AnnouncementPopup from "@/components/AnnouncementPopup";
import { getExchangeRates, getPreviousDayRates } from "@/lib/api";
import { AlertTriangle } from "lucide-react";

// Forzar que se ejecute en el servidor en cada petición
// (la lógica de cache está en api.ts, no en ISR de Next.js)
export const dynamic = "force-dynamic";

export default async function Home() {
  const [{ rates, source, fetchedAt }, previousRates] = await Promise.all([
    getExchangeRates(),
    getPreviousDayRates()
  ]);

  // Formatear fecha/hora de la última actualización
  const lastUpdate = new Date(fetchedAt);
  const dateStr = lastUpdate.toLocaleDateString("es-VE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const timeStr = lastUpdate.toLocaleTimeString("es-VE", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <main className="min-h-screen bg-transparent max-w-md mx-auto px-4 sm:px-6 relative">
      <Header />
      <CalculatorCard rates={rates} />

      <div className="mb-4 animate-md3-section-title">
        <div className="flex items-center justify-between ml-1 mr-1">
          <h2 className="text-base font-semibold text-foreground/80 font-display">
            Todas las tasas
          </h2>
          <span className="text-[11px] text-foreground/40">
            {dateStr} · {timeStr}
          </span>
        </div>
        {source === "fallback" && (
          <div className="text-xs text-amber-500 flex items-center gap-1 ml-1 mt-1 font-medium">
            <AlertTriangle className="w-3.5 h-3.5" />
            Datos desactualizados — sin conexión a la API
          </div>
        )}
      </div>

      <CurrencyList rates={rates} previousRates={previousRates} />
      <Footer />
      <AnnouncementPopup />
    </main>
  );
}
