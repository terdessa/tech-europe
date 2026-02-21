import { NextRequest, NextResponse } from "next/server";
import { dbAddMessage, dbGetRecentMessages, dbGetAllMessages } from "@/lib/local-db";

export async function GET(
  req: NextRequest,
  { params }: { params: { childId: string } }
) {
  const all = req.nextUrl.searchParams.get("all");
  if (all) {
    return NextResponse.json(dbGetAllMessages(params.childId));
  }
  const count = parseInt(req.nextUrl.searchParams.get("count") || "20", 10);
  return NextResponse.json(dbGetRecentMessages(params.childId, count));
}

export async function POST(
  req: NextRequest,
  { params }: { params: { childId: string } }
) {
  const data = await req.json();
  const id = dbAddMessage(params.childId, data);
  return NextResponse.json({ id });
}
