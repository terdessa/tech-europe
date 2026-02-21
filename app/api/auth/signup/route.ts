import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { dbFindUserByEmail, dbSetUser, genId } from "@/lib/local-db";

export async function POST(req: NextRequest) {
  try {
    const { email, password, displayName } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    const existing = dbFindUserByEmail(email);
    if (existing) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }

    const uid = genId();
    const passwordHash = crypto
      .createHash("sha256")
      .update(password)
      .digest("hex");

    dbSetUser(uid, {
      email,
      displayName: displayName || email.split("@")[0],
      passwordHash,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      uid,
      email,
      displayName: displayName || email.split("@")[0],
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Signup failed" },
      { status: 500 }
    );
  }
}
