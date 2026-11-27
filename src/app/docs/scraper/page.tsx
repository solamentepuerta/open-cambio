import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  Code2,
  Download,
  ExternalLink,
  FileCode2,
  Package,
  Server,
  ShieldCheck,
} from "lucide-react";
import ScraperLanguageTabs from "@/components/ScraperLanguageTabs";

export const metadata: Metadata = {
  title: "Scraper BCV en PHP | Open Cambio",
  description:
    "Descarga el recolector PHP del BCV y consulta las tasas desde JavaScript, Python, PHP, Java o C#. Incluye latest.json, historial diario, cron y guía TLS.",
  alternates: {
    canonical: "/docs/scraper",
  },
};

const REPO_URL = "https://github.com/solamentepuerta/open-cambio";
const SCRAPER_SOURCE_URL = `${REPO_URL}/blob/main/docs/scraper-bcv.php`;
const ZIP_URL = "/downloads/scraper-bcv.zip";
const CRON_EXAMPLE =
  "17 */4 * * * /usr/local/bin/php /home/USUARIO/bcv-scraper/scraper.php >> /home/USUARIO/bcv-scraper.log 2>&1";

function downloadUrl(file: "php" | "readme" | "htaccess" | "cacert" | "intermediate") {
  return `/api/downloads/scraper?file=${file}`;
}

export default function ScraperDocsPage() {
  return (
    <main className="min-h-screen bg-transparent max-w-3xl mx-auto px-4 sm:px-6 py-8">
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
        <h1 className="text-2xl sm:text-3xl font-bold font-display leading-tight">
          Scraper BCV en PHP
        </h1>
        <p className="mt-2 text-sm text-foreground/60 leading-relaxed max-w-2xl">
          Descarga el recolector que alimenta Open Cambio, ejecútalo en tu VPS o
          cPanel y consume las tasas desde el lenguaje que prefieras. Es software
          libre bajo licencia MIT.
        </p>
      </header>

      <div className="space-y-4">
        <section className="bg-primary/10 border border-primary/25 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 shrink-0 rounded-xl bg-primary/20 text-primary flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold font-display">Descarga el recolector</h2>
              <p className="mt-1 text-xs text-foreground/65 leading-relaxed">
                El paquete incluye <code>scraper.php</code>, el <code>.htaccess</code>,
                el README y los certificados TLS. También puedes descargar los
                archivos por separado.
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <a
              href={ZIP_URL}
              download
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-primary text-on-primary text-xs font-bold transition-all hover:bg-primary/90 active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              Descargar .zip
            </a>
            <a
              href={downloadUrl("php")}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-foreground/5 hover:bg-foreground/10 text-foreground/70 hover:text-primary text-xs font-semibold transition-all active:scale-95"
            >
              <FileCode2 className="w-3.5 h-3.5" />
              scraper.php
            </a>
            <a
              href={downloadUrl("cacert")}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-foreground/5 hover:bg-foreground/10 text-foreground/70 hover:text-primary text-xs font-semibold transition-all active:scale-95"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              cacert.pem
            </a>
            <a
              href={downloadUrl("readme")}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-foreground/5 hover:bg-foreground/10 text-foreground/70 hover:text-primary text-xs font-semibold transition-all active:scale-95"
            >
              README.md
            </a>
            <a
              href={downloadUrl("htaccess")}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-foreground/5 hover:bg-foreground/10 text-foreground/70 hover:text-primary text-xs font-semibold transition-all active:scale-95"
            >
              .htaccess
            </a>
          </div>
        </section>

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
          <h2 className="text-sm font-bold font-display mb-2">Consumir las tasas desde tu lenguaje</h2>
          <p className="text-xs text-foreground/60 leading-relaxed mb-3">
            Los ejemplos leen <code className="text-primary">latest.json</code> por
            HTTP. Cambia <code>TU-DOMINIO</code> por la URL donde publiques el
            scraper. Para el historial usa <code>daily-rates.json</code>.
          </p>
          <ScraperLanguageTabs />
          <p className="mt-3 text-[11px] text-foreground/50 leading-relaxed">
            Desde una terminal:{" "}
            <code className="text-primary">curl -s https://TU-DOMINIO/latest.json | jq &apos;.rates&apos;</code>
          </p>
        </section>

        <section className="bg-surface/70 border border-white/10 rounded-2xl p-5">
          <h2 className="text-sm font-bold font-display mb-2">Salidas</h2>
          <p className="text-xs text-foreground/60 leading-relaxed mb-3">
            Ambos archivos son JSON públicos. Puedes consumirlos desde una web,
            un bot, una hoja de cálculo o tu backend.
          </p>
          <pre className="bg-background/70 rounded-xl p-3 text-[11px] leading-relaxed overflow-x-auto border border-white/5">
            <code>{`latest.json
{
  "source": "vex-scraper",
  "capturedAt": "2026-11-27T18:39:43-04:00",
  "effectiveDate": "Lunes, 30 Noviembre 2026",
  "rates": {
    "USD": 928.5454,
    "EUR": 1016.30222575,
    "USDT": 1092.94
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
          <div className="flex items-center gap-2 mb-2">
            <Server className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold font-display">Instalar en VPS o cPanel</h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div className="bg-background/40 rounded-xl p-3.5 border border-white/5">
              <h3 className="text-xs font-bold mb-1.5">VPS</h3>
              <pre className="text-[10px] leading-relaxed overflow-x-auto text-foreground/70">
                <code>{`unzip scraper-bcv.zip
cd scraper-bcv
php scraper.php`}</code>
              </pre>
            </div>
            <div className="bg-background/40 rounded-xl p-3.5 border border-white/5">
              <h3 className="text-xs font-bold mb-1.5">cPanel</h3>
              <p className="text-[10px] text-foreground/60 leading-relaxed">
                Sube el ZIP con el Administrador de archivos, extráelo y da
                permiso de escritura a la carpeta. Luego abre{" "}
                <code>latest.json</code> desde el navegador.
              </p>
            </div>
          </div>

          <p className="mt-3 text-xs text-foreground/70 leading-relaxed">
            Programa el cron cada cuatro horas y guarda la salida en un log:
          </p>
          <pre className="mt-2 bg-background/70 rounded-xl p-3 text-[11px] leading-relaxed overflow-x-auto border border-white/5">
            <code>{CRON_EXAMPLE}</code>
          </pre>
          <p className="mt-3 text-xs text-foreground/60 leading-relaxed">
            El comando sale con código 0 cuando publica una tasa válida y con
            código 2 cuando el BCV no devolvió los datos esperados.
          </p>

          <div className="mt-4 rounded-xl bg-foreground/5 p-3.5">
            <h3 className="text-xs font-bold mb-1.5">Seguridad</h3>
            <p className="text-[11px] text-foreground/60 leading-relaxed">
              No publiques <code>scraper.php</code>, la carpeta <code>certs/</code>{" "}
              ni los archivos de diagnóstico. En Apache/cPanel el{" "}
              <code>.htaccess</code> incluido bloquea todo excepto los JSON. En
              Nginx agrega:
            </p>
            <pre className="mt-2 text-[10px] leading-relaxed overflow-x-auto text-foreground/70">
              <code>{`location ~ ^/(scraper\\.php|certs/) {
    deny all;
}`}</code>
            </pre>
          </div>
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
          <div className="mt-3 flex flex-wrap gap-2">
            <a
              href={downloadUrl("cacert")}
              className="text-[11px] font-semibold text-primary hover:text-primary/80 transition-colors"
            >
              Descargar cacert.pem
            </a>
            <span className="text-foreground/20">·</span>
            <a
              href={downloadUrl("intermediate")}
              className="text-[11px] font-semibold text-primary hover:text-primary/80 transition-colors"
            >
              Descargar intermedio Sectigo
            </a>
          </div>
        </section>

        <section className="bg-surface/70 border border-white/10 rounded-2xl p-5">
          <h2 className="text-sm font-bold font-display mb-2">Código y agradecimientos</h2>
          <p className="text-xs text-foreground/70 leading-relaxed">
            Gracias a quienes reportaron el fallo y aportaron mejoras a este
            recolector. El código completo está disponible para que lo adaptes,
            lo mejores y lo compartas.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <a
              href={SCRAPER_SOURCE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-foreground/5 hover:bg-foreground/10 text-foreground/70 hover:text-primary text-xs font-semibold transition-all active:scale-95"
            >
              Ver en GitHub
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </section>
      </div>

      <p className="mt-6 text-center text-[11px] text-foreground/35">
        Open Cambio es código abierto bajo licencia MIT.
      </p>
    </main>
  );
}
