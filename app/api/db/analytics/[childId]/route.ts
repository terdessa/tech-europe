import { NextRequest, NextResponse } from "next/server";
import { dbGetRecentAnalytics } from "@/lib/local-db";

export async function GET(
  req: NextRequest,
  { params }: { params: { childId: string } }
) {
  const days = parseInt(req.nextUrl.searchParams.get("days") || "7", 10);
  return NextResponse.json(dbGetRecentAnalytics(params.childId, days));
}
