import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { dbFindUserByEmail } from "@/lib/local-db";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    const found = dbFindUserByEmail(email);
    if (!found) {
      return NextResponse.json({ error: "No account found with this email" }, { status: 401 });
    }

    const passwordHash = crypto
      .createHash("sha256")
      .update(password)
      .digest("hex");

    if (found.data.passwordHash !== passwordHash) {
      return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
    }

    return NextResponse.json({
      uid: found.uid,
      email: found.data.email,
      displayName: found.data.displayName || null,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Login failed" },
      { status: 500 }
    );
  }
}
