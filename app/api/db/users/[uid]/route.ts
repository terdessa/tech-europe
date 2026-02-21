import { NextRequest, NextResponse } from "next/server";
import { dbGetUser, dbSetUser } from "@/lib/local-db";

export async function GET(
  _req: NextRequest,
  { params }: { params: { uid: string } }
) {
  const user = dbGetUser(params.uid);
  return NextResponse.json(user);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { uid: string } }
) {
  let data: Record<string, unknown> = {};
  try {
    data = await req.json();
  } catch {
    /* empty body is ok — treated as no-op merge */
  }
  dbSetUser(params.uid, data);
  return NextResponse.json({ ok: true });
}
