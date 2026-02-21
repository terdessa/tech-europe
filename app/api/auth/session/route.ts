import { NextRequest, NextResponse } from "next/server";
import { dbGetUser } from "@/lib/local-db";

export async function POST(req: NextRequest) {
  try {
    const { uid } = await req.json();
    if (!uid) {
      return NextResponse.json({ error: "Missing uid" }, { status: 400 });
    }

    const user = dbGetUser(uid);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    return NextResponse.json({
      uid,
      email: user.email,
      displayName: user.displayName,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Session error" },
      { status: 500 }
    );
  }
}
