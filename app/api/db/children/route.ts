import { NextRequest, NextResponse } from "next/server";
import { dbGetChildrenForParent, dbCreateChild } from "@/lib/local-db";

export async function GET(req: NextRequest) {
  const parentId = req.nextUrl.searchParams.get("parentId");
  if (!parentId) {
    return NextResponse.json({ error: "parentId required" }, { status: 400 });
  }
  const children = dbGetChildrenForParent(parentId);
  return NextResponse.json(children);
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  const id = dbCreateChild(data);
  return NextResponse.json({ id });
}
