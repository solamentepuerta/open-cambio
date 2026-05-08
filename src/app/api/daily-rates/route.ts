import { NextResponse } from "next/server";
import { safeRedisGet, safeRedisSet } from "@/lib/redis";
import fs from "fs";
import path from "path";

const REDIS_KEY = "rates:daily";
const LOCAL_FILE = path.join(process.cwd(), "data", "rates-daily.json");

export async function GET() {
    try {
        // 1. Intentar obtener datos de Redis
        let data = await safeRedisGet(REDIS_KEY);

        // 2. Si Redis está vacío, intentar hacer el "seed" desde el archivo local
        if (!data) {
            console.log("Redis is empty, checking for local seed file...");
            if (fs.existsSync(LOCAL_FILE)) {
                try {
                    const raw = fs.readFileSync(LOCAL_FILE, "utf-8");
                    data = JSON.parse(raw);
                    
                    // Guardar en Redis para futuras peticiones
                    await safeRedisSet(REDIS_KEY, data);
                    console.log("Redis seeded with local data/rates-daily.json");
                } catch (seedError) {
                    console.error("Failed to seed from local file:", seedError);
                }
            }
        }

        // 3. Devolver datos o un objeto vacío si nada funcionó
        return NextResponse.json(data || {});
    } catch (error) {
        console.error("Error fetching daily rates from Redis:", error);
        return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const secret = request.headers.get("x-api-secret");
        if (secret !== process.env.API_SECRET) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        
        // Guardar el nuevo historial en Redis
        await safeRedisSet(REDIS_KEY, body);
        
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error updating daily rates in Redis:", error);
        return NextResponse.json({ error: "Failed to update history" }, { status: 500 });
    }
}
