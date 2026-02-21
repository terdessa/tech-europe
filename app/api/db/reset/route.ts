import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DB_PATH = path.join(process.cwd(), ".local-db.json");

export async function POST() {
  try {
    const empty = {
      users: {},
      children: {},
      messages: {},
      missions: {},
      analytics: {},
      alerts: {},
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(empty, null, 2), "utf-8");
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Reset failed" },
      { status: 500 }
    );
  }
}
