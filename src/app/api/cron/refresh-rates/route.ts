import { NextResponse } from "next/server";
import { getExchangeRates } from "@/lib/api";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || secret.length < 32) {
    return NextResponse.json({ error: "Cron secret is not configured securely" }, { status: 503 });
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await getExchangeRates({ forceRefresh: true, recordDaily: true });
    return NextResponse.json({
      ok: true,
      refreshed: result.refreshed,
      source: result.rates.source,
      fetchedAt: result.rates.fetchedAt,
    });
  } catch (error) {
    console.error("Cron refresh failed", error);
    return NextResponse.json({ error: "Refresh failed" }, { status: 500 });
  }
}
