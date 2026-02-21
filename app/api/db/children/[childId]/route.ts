import { NextRequest, NextResponse } from "next/server";
import { dbGetChild, dbSetChild } from "@/lib/local-db";

export async function GET(
  _req: NextRequest,
  { params }: { params: { childId: string } }
) {
  const child = dbGetChild(params.childId);
  return NextResponse.json(child);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { childId: string } }
) {
  const childId = params.childId;
  const child = dbGetChild(childId);
  if (!child) {
    return NextResponse.json({ error: "Child not found" }, { status: 404 });
  }
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const uid = body.uid as string | undefined;
  if (!uid || child.parentId !== uid) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { uid: _drop, ...updates } = body;
  dbSetChild(childId, updates);
  return NextResponse.json({ ok: true });
}
