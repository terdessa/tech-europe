import { NextRequest, NextResponse } from "next/server";
import { dbUpdateMission } from "@/lib/local-db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { childId: string; missionId: string } }
) {
  const data = await req.json();
  dbUpdateMission(params.childId, params.missionId, data);
  return NextResponse.json({ ok: true });
}
