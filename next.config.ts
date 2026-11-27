import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Incluir los archivos descargables del scraper en el bundle de la función.
  outputFileTracingIncludes: {
    "/api/downloads/scraper": [
      "./docs/scraper-bcv.php",
      "./docs/scraper-readme.md",
      "./docs/scraper-htaccess.txt",
      "./docs/cacert.pem.txt",
      "./docs/sectigo-ov-r36.pem.txt",
    ],
  },
  // Permitir que el SW se sirva con los headers correctos
  headers: async () => [
    {
      source: "/sw.js",
      headers: [
        {
          key: "Cache-Control",
          value: "public, max-age=0, must-revalidate",
        },
        {
          key: "Service-Worker-Allowed",
          value: "/",
        },
      ],
    },
  ],
};

export default nextConfig;
