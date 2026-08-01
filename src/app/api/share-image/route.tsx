import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { getExchangeRates } from "@/lib/api";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const size = { width: 1200, height: 630 };
const calSansFont = readFile(
  path.join(
    process.cwd(),
    "node_modules",
    "@fontsource",
    "cal-sans",
    "files",
    "cal-sans-latin-400-normal.woff",
  ),
);
const appIcon = readFile(
  path.join(
    process.cwd(),
    "public",
    "icons",
    "android-chrome-192x192.png",
  ),
);
const rateFormatter = new Intl.NumberFormat("es-VE", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export async function GET() {
  const [{ rates: ratesData }, fontBuffer, iconBuffer] = await Promise.all([
    getExchangeRates({ recordDaily: false }),
    calSansFont,
    appIcon,
  ]);
  const iconDataUrl = `data:image/png;base64,${iconBuffer.toString("base64")}`;
  const rates = ratesData.rates.filter((rate) =>
    ["USD", "EUR", "USDT"].includes(rate.symbol),
  );
  const updatedAt = new Date(ratesData.fetchedAt).toLocaleString("es-VE", {
    timeZone: "America/Caracas",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          position: "relative",
          overflow: "hidden",
          padding: "58px 68px",
          color: "#E6E1E5",
          fontFamily: "Cal Sans",
          backgroundImage:
            "linear-gradient(135deg, #1C1B1F 0%, #242126 52%, #172015 100%)",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: 420,
            height: 420,
            borderRadius: 999,
            background: "rgba(130, 224, 58, 0.12)",
            top: -220,
            right: -110,
          }}
        />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={iconDataUrl}
              alt=""
              width={70}
              height={70}
              style={{
                width: 70,
                height: 70,
                borderRadius: 22,
              }}
            />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 48, fontWeight: 800 }}>{SITE_NAME}</div>
              <div
                style={{
                  fontSize: 17,
                  letterSpacing: 4,
                  textTransform: "uppercase",
                  color: "rgba(230, 225, 229, 0.58)",
                }}
              >
                Tasa libre de Venezuela
              </div>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              padding: "12px 20px",
              borderRadius: 999,
              color: "#82E03A",
              background: "rgba(130, 224, 58, 0.1)",
              border: "1px solid rgba(130, 224, 58, 0.25)",
              fontSize: 18,
            }}
          >
            Tasas actualizadas
          </div>
        </div>

        <div style={{ display: "flex", gap: 22, width: "100%" }}>
          {rates.map((rate) => (
            <div
              key={rate.symbol}
              style={{
                flex: 1,
                minHeight: 218,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                padding: "30px 28px",
                borderRadius: 28,
                background: "rgba(43, 43, 45, 0.92)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                boxShadow: "0 18px 48px rgba(0, 0, 0, 0.22)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ fontSize: 25, fontWeight: 700 }}>
                  {rate.symbol === "USD" ? "Dólar BCV" : rate.name}
                </div>
                <div
                  style={{
                    display: "flex",
                    padding: "6px 10px",
                    borderRadius: 999,
                    fontSize: 16,
                    color: "#00390A",
                    background: "#82E03A",
                    fontWeight: 800,
                  }}
                >
                  {rate.symbol}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div
                  style={{
                    display: "flex",
                    fontSize: 20,
                    color: "rgba(230, 225, 229, 0.55)",
                    marginBottom: 4,
                  }}
                >
                  1 {rate.symbol}
                </div>
                <div style={{ display: "flex", fontSize: 40, fontWeight: 800 }}>
                  Bs {rateFormatter.format(rate.rate)}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            color: "rgba(230, 225, 229, 0.58)",
            fontSize: 18,
          }}
        >
          <div style={{ display: "flex" }}>Actualizado: {updatedAt}</div>
          <div style={{ display: "flex", color: "#82E03A", fontWeight: 700 }}>
            {SITE_URL.replace("https://", "")}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Cal Sans",
          data: fontBuffer,
          weight: 400,
          style: "normal",
        },
      ],
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    },
  );
}
