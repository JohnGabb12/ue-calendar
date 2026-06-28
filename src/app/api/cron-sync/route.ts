// app/api/cron-sync/route.ts
import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { CalendarSchema } from "~/lib/types";
import { extractCalendarData } from "~/lib/parser"; 

const redis = Redis.fromEnv();

const CALENDAR_URL =
  "https://www.ue.edu.ph/mla/school-calendar-events-activities/" as string;

export async function GET(request: Request) {
  // Protect the cron route using Vercel's environment secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const response = await fetch(CALENDAR_URL, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)",
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: `Fetch failed: ${response.status}` }, { status: 500 });
    }

    const html = await response.text();

    // Run your custom extraction utility
    const extracted = extractCalendarData(html);
    if (!extracted) {
      return NextResponse.json({ error: "Failed to extract HTML structure" }, { status: 500 });
    }

    // Validate it against your Zod schema to ensure data integrity
    const validatedData = CalendarSchema.parse(extracted);

    // Save the completely structured object into Upstash Redis
    await redis.set("calendar_cache", validatedData);

    return NextResponse.json({ success: true, updated: new Date().toISOString() });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}