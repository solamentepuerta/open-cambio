import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Code2, ExternalLink, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Scraper BCV en PHP | Open Cambio",
  description:
    "Documentación del recolector PHP que consulta las tasas del BCV y USDT.com.ve y publica latest.json y daily-rates.json. Código abierto para reutilizar en otros proyectos.",
  alternates: {
    canonical: "/docs/scraper",
  },
};

const REPO_URL = "https://github.com/solamentepuerta/open-cambio";
const SCRAPER_URL = `${REPO_URL}/blob/main/docs/scraper-bcv.php`;
const CRON_EXAMPLE =
  "17 */4 * * * /usr/local/bin/php /home/USUARIO/bcv-scraper/scraper.php >> /home/USUARIO/bcv-scraper.log 2>&1";

export default function ScraperDocsPage() {
  return (
    <main className="min-h-screen bg-transparent max-w-md mx-auto px-4 sm:px-6 py-8">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground/50 hover:text-primary transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Volver a las tasas
      </Link>

      <header className="mt-6 mb-6">
        <div className="w-11 h-11 rounded-2xl bg-primary/15 text-primary flex items-center justify-center mb-4">
          <Code2 className="w-5 h-5" />
        </div>
        <h1 className="text-2xl font-bold font-display leading-tight">
          Scraper BCV en PHP
        </h1>
        <p className="mt-2 text-sm text-foreground/60 leading-relaxed">
          El recolector que alimenta Open Cambio. Es software libre y puedes
          usarlo en tus propios proyectos para obtener las tasas oficiales del
          Banco Central de Venezuela y la referencia USDT/VES.
        </p>
      </header>

      <div className="space-y-4">
        <section className="bg-surface/70 border border-white/10 rounded-2xl p-5">
          <h2 className="text-sm font-bold font-display mb-2">Qué hace</h2>
          <ul className="text-xs text-foreground/70 space-y-2 leading-relaxed list-disc pl-4">
            <li>Descarga la página del BCV y extrae USD y EUR.</li>
            <li>Consulta USDT/VES en usdt.com.ve y conserva el último valor válido si la fuente falla.</li>
            <li>Publica <code className="text-primary">latest.json</code> y un historial diario de hasta 400 días en <code className="text-primary">daily-rates.json</code>.</li>
            <li>Escribe los archivos de forma atómica para que nadie lea un JSON a medio escribir.</li>
          </ul>
        </section>

        <section className="bg-surface/70 border border-white/10 rounded-2xl p-5">
          <h2 className="text-sm font-bold font-display mb-2">Salidas</h2>
          <p className="text-xs text-foreground/60 leading-relaxed mb-3">
            Ambos archivos son JSON públicos. Puedes consumirlos directamente
            desde una web, un bot o una hoja de cálculo.
          </p>
          <pre className="bg-background/70 rounded-xl p-3 text-[11px] leading-relaxed overflow-x-auto border border-white/5">
            <code>{`latest.json
{
  "source": "vex-scraper",
  "capturedAt": "2026-11-27T16:48:33-04:00",
  "effectiveDate": "Lunes, 30 Noviembre 2026",
  "rates": {
    "USD": 928.5454,
    "EUR": 1016.30222575,
    "USDT": 1087.759
  },
  "usdtFresh": true
}`}</code>
          </pre>
          <p className="mt-3 text-xs text-foreground/60 leading-relaxed">
            <code className="text-primary">daily-rates.json</code> es un objeto
            con claves <code>YYYY-MM-DD</code>. Cada entrada incluye{" "}
            <code>usd</code>, <code>eur</code>, <code>usdt</code> y <code>date</code>.
            Las fechas importadas desde el histórico del BCV pueden no incluir{" "}
            <code>usdt</code>.
          </p>
        </section>

        <section className="bg-surface/70 border border-white/10 rounded-2xl p-5">
          <h2 className="text-sm font-bold font-display mb-2">Cómo ejecutarlo</h2>
          <ol className="text-xs text-foreground/70 space-y-2 leading-relaxed list-decimal pl-4">
            <li>Sube <code>scraper.php</code> y la carpeta <code>certs/</code> a tu hosting con PHP 8.1 o superior.</li>
            <li>Da permiso de escritura al directorio donde se publicarán los JSON.</li>
            <li>Programa el cron cada cuatro horas y guarda la salida en un log.</li>
          </ol>
          <pre className="mt-3 bg-background/70 rounded-xl p-3 text-[11px] leading-relaxed overflow-x-auto border border-white/5">
            <code>{CRON_EXAMPLE}</code>
          </pre>
          <p className="mt-3 text-xs text-foreground/60 leading-relaxed">
            El comando sale con código 0 cuando publica una tasa válida y con
            código 2 cuando el BCV no devolvió los datos esperados. Así puedes
            encadenar un aviso o un refresco de caché.
          </p>
        </section>

        <section className="bg-surface/70 border border-white/10 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold font-display">Certificado TLS</h2>
          </div>
          <p className="text-xs text-foreground/70 leading-relaxed">
            El BCV puede presentar su certificado sin enviar el intermedio de
            Sectigo. Los navegadores lo buscan solos, pero curl y PHP no. Si ves
            <code className="text-primary"> unable to get local issuer certificate</code>,
            agrega el intermedio <strong>Sectigo Public Server Authentication CA OV R36</strong>{" "}
            al bundle <code>certs/cacert.pem</code>. No desactives la verificación TLS.
          </p>
          <pre className="mt-3 bg-background/70 rounded-xl p-3 text-[11px] leading-relaxed overflow-x-auto border border-white/5">
            <code>{`curl -sS -o /dev/null -w '%{http_code} %{ssl_verify_result}\\n' \\
  --cacert certs/cacert.pem https://www.bcv.org.ve/
# Debe responder: 200 0`}</code>
          </pre>
        </section>

        <section className="bg-surface/70 border border-white/10 rounded-2xl p-5">
          <h2 className="text-sm font-bold font-display mb-2">Código y agradecimientos</h2>
          <p className="text-xs text-foreground/70 leading-relaxed">
            Gracias a quienes reportaron el fallo y aportaron mejoras a este
            recolector. El código completo está disponible para que lo adaptes,
            lo mejores y lo compartas.
          </p>
          <a
            href={SCRAPER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-foreground/5 hover:bg-foreground/10 text-foreground/70 hover:text-primary text-xs font-semibold transition-all active:scale-95"
          >
            Ver scraper-bcv.php
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </section>
      </div>

      <p className="mt-6 text-center text-[11px] text-foreground/35">
        Open Cambio es código abierto bajo licencia MIT.
      </p>
    </main>
  );
}
