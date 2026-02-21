import { NextRequest, NextResponse } from "next/server";
import { dbGetAlerts } from "@/lib/local-db";

export async function GET(
  _req: NextRequest,
  { params }: { params: { childId: string } }
) {
  return NextResponse.json(dbGetAlerts(params.childId));
}
