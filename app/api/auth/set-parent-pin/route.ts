import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { dbGetUser, dbSetUser } from "@/lib/local-db";

function hashPin(pin: string): string {
  return createHash("sha256").update(pin, "utf8").digest("hex");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { uid, pin } = body as { uid?: string; pin?: string };

    if (!uid || typeof pin !== "string") {
      return NextResponse.json(
        { error: "Missing uid or pin" },
        { status: 400 }
      );
    }

    const trimmed = pin.replace(/\D/g, "");
    if (trimmed.length < 4 || trimmed.length > 6) {
      return NextResponse.json(
        { error: "PIN must be 4–6 digits" },
        { status: 400 }
      );
    }

    const user = dbGetUser(uid);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const parentPinHash = hashPin(trimmed);
    dbSetUser(uid, { parentPinHash });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  }
}
