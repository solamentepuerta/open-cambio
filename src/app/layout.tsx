import type { Metadata, Viewport } from "next";
import "@fontsource/cal-sans";
import { Inter } from "next/font/google";
import "./globals.css";
import ThemeProvider from "@/components/ThemeProvider";
import SettingsPanel from "@/components/SettingsPanel";
import CalendarPanel from "@/components/CalendarPanel";
import SplashScreen from "@/components/SplashScreen";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import { Analytics } from "@vercel/analytics/react";
import CalculatorDrawer from "@/components/CalculatorDrawer";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const siteUrl = "https://vex.vercel.app";
const siteTitle = "Vex - Tasa libre de Venezuela";
const siteDescription =
  "Consulta las tasas del dólar BCV, euro y USDT en tiempo real. Calculadora de cambio rápida, sin anuncios y de código abierto.";

export const metadata: Metadata = {
  title: siteTitle,
  description: siteDescription,
  manifest: "/manifest.json",
  metadataBase: new URL(siteUrl),
  keywords: [
    "tasa de cambio",
    "dólar Venezuela",
    "BCV",
    "USDT",
    "euro Venezuela",
    "bolívares",
    "cambio dólar",
    "dólar paralelo",
    "Vex",
    "calculadora cambio",
  ],
  authors: [{ name: "Vex", url: siteUrl }],
  creator: "Vex",
  openGraph: {
    type: "website",
    locale: "es_VE",
    url: siteUrl,
    title: siteTitle,
    description: siteDescription,
    siteName: "Vex",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Vex — Tasas de cambio en Venezuela",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: ["/og-image.png"],
  },
  icons: {
    icon: [
      { url: "/icons/favicon.ico", sizes: "any" },
      { url: "/icons/favicon.svg", type: "image/svg+xml" },
      { url: "/icons/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    shortcut: "/icons/favicon.ico",
    apple: [
      {
        url: "/icons/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Vex",
  },
};

export const viewport: Viewport = {
  themeColor: "#82E03A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider>
          <SplashScreen />
          <ServiceWorkerRegistration />
          {children}
          <CalendarPanel />
          <SettingsPanel />
          <CalculatorDrawer />
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
