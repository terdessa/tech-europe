import { NextRequest, NextResponse } from "next/server";
import { dbGetChild } from "@/lib/local-db";

export async function GET(
  _req: NextRequest,
  { params }: { params: { childId: string } }
) {
  const child = dbGetChild(params.childId);
  return NextResponse.json(child);
}
