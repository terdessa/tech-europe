import { NextRequest, NextResponse } from "next/server";
import { dbGetMissions, dbAddMission } from "@/lib/local-db";

export async function GET(
  _req: NextRequest,
  { params }: { params: { childId: string } }
) {
  return NextResponse.json(dbGetMissions(params.childId));
}

export async function POST(
  req: NextRequest,
  { params }: { params: { childId: string } }
) {
  const data = await req.json();
  const id = dbAddMission(params.childId, data);
  return NextResponse.json({ id });
}
