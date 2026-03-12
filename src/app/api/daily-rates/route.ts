import { NextResponse } from "next/server";
import fs from "fs";
import { DAILY_FILE } from "@/lib/fallback";

export async function GET() {
    try {
        if (!fs.existsSync(DAILY_FILE)) {
            return NextResponse.json({});
        }
        const raw = fs.readFileSync(DAILY_FILE, "utf-8");
        const data = JSON.parse(raw);
        return NextResponse.json(data);
    } catch {
        return NextResponse.json({}, { status: 500 });
    }
}
