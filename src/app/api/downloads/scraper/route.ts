import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const FILES = {
  php: {
    name: "scraper-bcv.php",
    filename: "scraper.php",
    contentType: "text/plain; charset=utf-8",
  },
  readme: {
    name: "scraper-readme.md",
    filename: "README.md",
    contentType: "text/markdown; charset=utf-8",
  },
  htaccess: {
    name: "scraper-htaccess.txt",
    filename: ".htaccess",
    contentType: "text/plain; charset=utf-8",
  },
  cacert: {
    name: "cacert.pem.txt",
    filename: "cacert.pem",
    contentType: "application/x-pem-file",
  },
  intermediate: {
    name: "sectigo-ov-r36.pem.txt",
    filename: "sectigo-ov-r36.pem",
    contentType: "application/x-pem-file",
  },
} as const;

type DownloadKey = keyof typeof FILES;

function isDownloadKey(value: string): value is DownloadKey {
  return value in FILES;
}

export async function GET(request: Request) {
  const requested = new URL(request.url).searchParams.get("file") ?? "php";
  if (!isDownloadKey(requested)) {
    return NextResponse.json({ error: "Archivo no encontrado" }, { status: 404 });
  }

  const file = FILES[requested];
  try {
    const body = await readFile(path.join(process.cwd(), "docs", file.name));
    return new NextResponse(new Uint8Array(body), {
      headers: {
        "Content-Type": file.contentType,
        "Content-Disposition": `attachment; filename="${file.filename}"`,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Scraper download failed", error);
    return NextResponse.json({ error: "Archivo no disponible" }, { status: 500 });
  }
}
