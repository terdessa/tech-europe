import { NextRequest, NextResponse } from "next/server";
import { sendAlert } from "@/lib/providers/codewords";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { childName, riskLevel, categories, parentMessage, timestamp } = body;

    if (!childName || !riskLevel) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const result = await sendAlert({
      childName,
      riskLevel,
      categories: categories || [],
      parentMessage: parentMessage || "",
      timestamp: timestamp || new Date().toISOString(),
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("CodeWords alert error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Alert failed" },
      { status: 500 }
    );
  }
}
