import { NextResponse } from "next/server";
import prisma from "@/lib/db";

// Internal endpoint - returns API keys from PlatformSettings
// Used by ai-providers.ts to get keys from DB
// No auth needed since this is only called server-side internally
export async function GET() {
  try {
    const settings = await prisma.platformSettings.findUnique({
      where: { id: "platform" },
      select: {
        openaiApiKey: true,
        anthropicApiKey: true,
        googleAiApiKey: true,
        sendgridApiKey: true,
        twilioSid: true,
        twilioToken: true,
        twilioPhone: true,
      },
    });

    return NextResponse.json(settings || {});
  } catch (error) {
    console.error("API keys fetch error:", error);
    return NextResponse.json({});
  }
}
