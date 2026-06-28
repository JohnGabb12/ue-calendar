// app/api/cron-sync/route.ts
import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { CalendarSchema } from "~/lib/types";
import { extractCalendarData } from "~/lib/parser"; 
import { ZodError } from "zod";

const redis = Redis.fromEnv();

const CALENDAR_URL = "https://www.ue.edu.ph/mla/school-calendar-events-activities/";

export async function GET(request: Request) {
  // Protect the cron route using Vercel's environment secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    console.log("🚀 Starting Cron Sync for UE Calendar...");
    
    const response = await fetch(CALENDAR_URL, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!response.ok) {
      console.error(`❌ UE Server responded with status: ${response.status}`);
      return NextResponse.json({ error: `Fetch failed: ${response.status}` }, { status: 500 });
    }

    const html = await response.text();
    console.log(`📡 HTML successfully fetched. Size: ${html.length} characters.`);

    // Run your custom extraction utility
    const extracted = extractCalendarData(html);
    console.log("🧩 Extracted Parse Result:", JSON.stringify(extracted));

    if (!extracted || (Array.isArray(extracted) && extracted.length === 0)) {
      console.error("❌ Parser Error: extractCalendarData returned empty or null.");
      return NextResponse.json({ error: "Failed to extract HTML structure" }, { status: 500 });
    }

    // Validate it against your Zod schema to ensure data integrity
    const validatedData = CalendarSchema.parse(extracted);
    console.log("✅ Zod Validation Passed successfully.");

    // Save the completely structured object into Upstash Redis
    await redis.set("calendar_cache", validatedData);
    console.log("💾 Upstash Redis cache successfully updated under key 'calendar_cache'.");

    return NextResponse.json({ success: true, updated: new Date().toISOString() });
  } catch (error) {
    if (error instanceof ZodError) {
      console.error("❌ Zod Validation Error Details:", JSON.stringify(error.errors, null, 2));
      return NextResponse.json({ success: false, error: "Zod Schema Mismatch", details: error.errors }, { status: 500 });
    }

    console.error("❌ System Error during cron sync:", (error as Error).message);
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}