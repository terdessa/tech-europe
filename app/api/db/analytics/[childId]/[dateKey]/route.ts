import { NextRequest, NextResponse } from "next/server";
import { dbGetDailyAnalytics } from "@/lib/local-db";

export async function GET(
  _req: NextRequest,
  { params }: { params: { childId: string; dateKey: string } }
) {
  return NextResponse.json(dbGetDailyAnalytics(params.childId, params.dateKey));
}
