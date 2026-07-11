import { NextResponse } from "next/server";
import { getDailyRates, replaceDailyRates } from "@/lib/api";
import { DailyEntry, DailyRates } from "@/types";

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MAX_BODY_BYTES = 500_000;

function hasStrongSecret(value: string | undefined): value is string {
  return Boolean(value && value.length >= 32);
}

function isDailyEntry(value: unknown): value is DailyEntry {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const entry = value as Partial<DailyEntry>;
  return (
    Object.keys(entry).every((key) => ["usd", "eur", "usdt", "date"].includes(key)) &&
    [entry.usd, entry.eur, entry.usdt].every(
      (rate) => typeof rate === "number" && Number.isFinite(rate) && rate > 0,
    ) &&
    typeof entry.date === "string" &&
    !Number.isNaN(Date.parse(entry.date))
  );
}

function isDailyRates(value: unknown): value is DailyRates {
  return Boolean(
    value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      Object.entries(value).every(
        ([key, entry]) => DATE_KEY_PATTERN.test(key) && isDailyEntry(entry),
      ),
  );
}

export async function GET() {
  try {
    return NextResponse.json(await getDailyRates());
  } catch (error) {
    console.error("Failed to fetch daily rates", error);
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const configuredSecret = process.env.API_SECRET;
  if (!hasStrongSecret(configuredSecret)) {
    return NextResponse.json({ error: "Server secret is not configured securely" }, { status: 503 });
  }
  if (request.headers.get("x-api-secret") !== configuredSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) {
      return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }
    const body: unknown = JSON.parse(rawBody);
    if (!isDailyRates(body)) {
      return NextResponse.json({ error: "Invalid daily rates payload" }, { status: 400 });
    }
    const stored = await replaceDailyRates(body);
    if (!stored) return NextResponse.json({ error: "Storage unavailable" }, { status: 503 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update daily rates", error);
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }
}
