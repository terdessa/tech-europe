import type { CharacterInfo } from "@/types/domain";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

interface GeminiResponse {
  candidates?: {
    content?: {
      parts?: { text?: string }[];
    };
  }[];
}

async function callGemini(prompt: string): Promise<string> {
  const res = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 2048,
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`Gemini API error: ${res.status} ${await res.text()}`);
  }

  const data: GeminiResponse = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Empty response from Gemini");
  return text;
}

export async function generateCharacterInfo(
  childName: string,
  childAge: number,
  characterName: string
): Promise<CharacterInfo> {
  const prompt = `You are creating a safe, child-friendly storybook character for a ${childAge}-year-old child named ${childName}.

The child wants a character called "${characterName}".

IMPORTANT: If this is a famous or copyrighted character name, create an ORIGINAL character that is "inspired by" the concept but is clearly a new, unique creation. Do NOT directly copy any copyrighted character. Instead, capture the spirit or archetype in a fresh way.

Generate a JSON object (and ONLY the JSON, no markdown) with these fields:
{
  "personality": "A warm, detailed description of the character's personality (2-3 sentences)",
  "speechStyle": "How the character talks — vocabulary level, catchphrases, tone (1-2 sentences)",
  "keyTraits": ["trait1", "trait2", "trait3", "trait4", "trait5"],
  "backstorySummary": "A short, child-safe backstory (2-3 sentences)",
  "safeDepictionNote": "A note about how this character should be visually depicted in a safe, generic way"
}

Make it age-appropriate for a ${childAge}-year-old. Be warm, creative, and engaging. The character should feel like a kind friend from a picture book.`;

  const text = await callGemini(prompt);
  const cleaned = text.replace(/```json\n?|\n?```/g, "").trim();
  return JSON.parse(cleaned) as CharacterInfo;
}

export async function generateChatReply(
  characterName: string,
  characterInfo: CharacterInfo,
  childAge: number,
  kidMessage: string,
  recentMessages: { role: string; content: string }[],
  emotionContext: {
    recommendedTone: string;
    suggestedApproach: string;
    currentMood: string;
  }
): Promise<string> {
  const historyStr = recentMessages
    .slice(-10)
    .map((m) => `${m.role === "kid" ? "Child" : characterName}: ${m.content}`)
    .join("\n");

  const prompt = `You are ${characterName}, a storybook character companion for a ${childAge}-year-old child.

YOUR CHARACTER:
- Personality: ${characterInfo.personality}
- Speech style: ${characterInfo.speechStyle}
- Key traits: ${characterInfo.keyTraits.join(", ")}
- Backstory: ${characterInfo.backstorySummary || "A friendly character from a magical storybook world"}

EMOTIONAL CONTEXT (from analysis):
- Child's current mood: ${emotionContext.currentMood}
- Recommended tone: ${emotionContext.recommendedTone}
- Suggested approach: ${emotionContext.suggestedApproach}

CONVERSATION SO FAR:
${historyStr || "(This is the start of the conversation)"}

CHILD'S MESSAGE: "${kidMessage}"

RULES:
- Stay in character as ${characterName} at all times
- Use age-appropriate language for a ${childAge}-year-old
- Be warm, supportive, and emotionally validating
- Keep response under ${childAge <= 8 ? "3" : "5"} sentences
- Never mention being an AI or break character
- Never share personal information or encourage risky behavior
- If the child seems upset, be extra gentle and reassuring
- Match the recommended tone from the emotional context

Respond as ${characterName}:`;

  return callGemini(prompt);
}
