import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAvailableProviders } from "@/lib/ai-providers";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const providers = getAvailableProviders();

    return NextResponse.json({
      providers,
      default: providers[0] || null,
    });
  } catch (error) {
    console.error("AI providers error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
