import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { dbGetUser } from "@/lib/local-db";

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

    const user = dbGetUser(uid);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const stored = user.parentPinHash as string | undefined;
    if (!stored) {
      return NextResponse.json(
        { error: "No PIN set" },
        { status: 401 }
      );
    }

    const trimmed = pin.replace(/\D/g, "");
    const hash = hashPin(trimmed);

    if (hash !== stored) {
      return NextResponse.json(
        { error: "Invalid PIN" },
        { status: 401 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  }
}
