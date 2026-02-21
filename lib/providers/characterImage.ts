import type { CharacterInfo } from "@/types/domain";
import { writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

// Nano Banana: Gemini 2.5 Flash Image for text-to-image (see https://ai.google.dev/gemini-api/docs/image-generation)
const IMAGE_MODEL_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent";

function getInlineImageFromPart(part: Record<string, unknown>): { mimeType: string; data: string } | null {
  // API can return camelCase (inlineData) or snake_case (inline_data)
  const inline = (part.inlineData as { mimeType?: string; data?: string } | undefined) ?? (part.inline_data as { mime_type?: string; data?: string } | undefined);
  if (!inline?.data) return null;
  const mimeType = (inline as { mimeType?: string }).mimeType ?? (inline as { mime_type?: string }).mime_type ?? "image/png";
  if (!mimeType.startsWith("image/")) return null;
  return { mimeType, data: inline.data as string };
}

export async function generateCharacterImage(
  characterName: string,
  characterInfo: CharacterInfo
): Promise<string | null> {
  const apiKey = process.env.GOOGLE_IMAGE_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("Character image: no GOOGLE_IMAGE_API_KEY or GEMINI_API_KEY set");
    return null;
  }

  // Use description-based prompt (no character name) so book/cartoon characters (Elsa, Olaf, etc.)
  // don't trigger refusals. Generates a matching cartoon avatar from personality/gender.
  const traits = characterInfo.keyTraits?.slice(0, 2).join(", ") || characterInfo.personality || "";
  const prompt = `Friendly cartoon character, ${characterInfo.gender}, ${characterInfo.personality}${traits ? `, ${traits}` : ""}, cartoon style facing camera, simple background`;

  try {
    const res = await fetch(
      `${IMAGE_MODEL_URL}?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseModalities: ["TEXT", "IMAGE"],
          },
        }),
      }
    );

    const rawText = await res.text();
    if (!res.ok) {
      console.error("Image generation API error:", res.status, rawText);
      return null;
    }

    let data: { candidates?: { content?: { parts?: Record<string, unknown>[] } }[] };
    try {
      data = JSON.parse(rawText);
    } catch {
      console.error("Image generation: invalid JSON response");
      return null;
    }

    const parts = data.candidates?.[0]?.content?.parts;
    if (!parts?.length) {
      console.warn("Image generation: no candidates or parts in response");
      return null;
    }

    for (const part of parts) {
      const img = getInlineImageFromPart(part);
      if (!img) continue;

      const ext = img.mimeType === "image/png" ? "png" : "webp";
      const safeName = characterName.toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 30);
      const filename = `${safeName}-${Date.now()}.${ext}`;
      const dir = join(process.cwd(), "public", "characters");
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
      const filePath = join(dir, filename);
      writeFileSync(filePath, Buffer.from(img.data, "base64"));
      const url = `/characters/${filename}`;
      console.log("[characterImage] Saved image:", url);
      return url;
    }

    const partTypes = parts.map((p) => (p.inlineData ?? p.inline_data ? "image" : "text"));
    console.warn("[characterImage] No image part in response. Part types:", partTypes.join(", "));
    return null;
  } catch (err) {
    console.error("Character image generation failed:", err);
    return null;
  }
}
