import { NextRequest, NextResponse } from "next/server";
import { dbGetChild, dbSetChild } from "@/lib/local-db";
import { generateCharacterImage } from "@/lib/providers/characterImage";
import type { CharacterInfo } from "@/types/domain";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { childId, uid } = body as { childId?: string; uid?: string };
    if (!childId || !uid) {
      return NextResponse.json(
        { error: "Missing childId or uid" },
        { status: 400 }
      );
    }

    const childRecord = dbGetChild(childId);
    if (!childRecord) {
      return NextResponse.json({ error: "Child not found" }, { status: 404 });
    }
    if ((childRecord.parentId as string) !== uid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const characterName = childRecord.characterName as string;
    const characterInfo = childRecord.characterInfo as CharacterInfo;

    const imageUrl = await generateCharacterImage(characterName, characterInfo);
    if (imageUrl) {
      dbSetChild(childId, { characterImageUrl: imageUrl });
    }

    return NextResponse.json({
      ok: true,
      characterImageUrl: imageUrl ?? (childRecord.characterImageUrl as string | undefined),
    });
  } catch (error) {
    console.error("Regenerate character image error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate image" },
      { status: 500 }
    );
  }
}
