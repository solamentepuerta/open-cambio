import { NextResponse } from "next/server";
import { getExchangeRates } from "@/lib/api";
import { acquireRedisLock, getRedis, safeRedisTtl } from "@/lib/redis";

const COOLDOWN_KEY = "rates:manual_refresh_cooldown";
const COOLDOWN_SECONDS = 5 * 60;

export const runtime = "nodejs";

export async function GET() {
  const ttl = await safeRedisTtl(COOLDOWN_KEY);
  return NextResponse.json({
    available: ttl === null || ttl <= 0,
    retryAfter: ttl && ttl > 0 ? ttl : 0,
  });
}

export async function POST() {
  if (!getRedis()) {
    return NextResponse.json(
      { error: "El servicio de actualización no está disponible" },
      { status: 503 },
    );
  }

  const cooldownToken = await acquireRedisLock(COOLDOWN_KEY, COOLDOWN_SECONDS);
  if (!cooldownToken) {
    const ttl = await safeRedisTtl(COOLDOWN_KEY);
    const retryAfter = ttl && ttl > 0 ? ttl : COOLDOWN_SECONDS;
    return NextResponse.json(
      { error: "Las tasas se actualizaron recientemente", retryAfter },
      { status: 429, headers: { "Retry-After": String(retryAfter) } },
    );
  }

  try {
    const result = await getExchangeRates({ forceRefresh: true, recordDaily: true });
    return NextResponse.json({
      ok: true,
      refreshed: result.refreshed,
      fetchedAt: result.rates.fetchedAt,
      source: result.rates.source,
      retryAfter: COOLDOWN_SECONDS,
    });
  } catch (error) {
    console.error("Manual rate refresh failed", error);
    return NextResponse.json(
      { error: "No se pudieron actualizar las tasas", retryAfter: COOLDOWN_SECONDS },
      { status: 502 },
    );
  }
}
