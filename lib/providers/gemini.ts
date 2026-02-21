import type { CharacterInfo, CharacterGender } from "@/types/domain";

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

export interface ChildProfile {
  name: string;
  age: number;
  interests: string[];
  communicationLevel?: string;
  personalityType?: string;
  sensitivities?: string[];
  favoriteColor?: string;
}

export async function generateCharacterInfo(
  childName: string,
  childAge: number,
  characterName: string,
  childInterests: string[] = [],
  characterGender?: CharacterGender
): Promise<CharacterInfo> {
  const interestsBlock = childInterests.length > 0
    ? `\n\nThe child's interests and hobbies include: ${childInterests.join(", ")}. The character should naturally connect with these interests — maybe sharing some of them, being curious about them, or having related experiences from their own backstory. This makes the character feel like a real friend who "gets" the child.`
    : "";

  const genderHint = characterGender
    ? `\nThe character's gender should be: ${characterGender}.`
    : "";

  const prompt = `You are creating a safe, child-friendly storybook character for a ${childAge}-year-old child named ${childName}.

The child wants a character called "${characterName}".${genderHint}${interestsBlock}

IMPORTANT: If this is a famous or copyrighted character name, create an ORIGINAL character that is "inspired by" the concept but is clearly a new, unique creation. Do NOT directly copy any copyrighted character. Instead, capture the spirit or archetype in a fresh way.

Generate a JSON object (and ONLY the JSON, no markdown) with these fields:
{
  "personality": "A warm, detailed description of the character's personality (2-3 sentences). Weave in connections to the child's interests naturally.",
  "speechStyle": "How the character talks — vocabulary level, catchphrases, tone (1-2 sentences)",
  "keyTraits": ["trait1", "trait2", "trait3", "trait4", "trait5"],
  "backstorySummary": "A short, child-safe backstory (2-3 sentences) that references shared interests with the child when possible",
  "safeDepictionNote": "A note about how this character should be visually depicted in a safe, generic way",
  "gender": "male" or "female" or "neutral"
}

Make it age-appropriate for a ${childAge}-year-old. Be warm, creative, and engaging. The character should feel like a kind friend from a picture book.`;

  const text = await callGemini(prompt);
  const cleaned = text.replace(/```json\n?|\n?```/g, "").trim();
  const parsed = JSON.parse(cleaned);
  return {
    personality: parsed.personality,
    speechStyle: parsed.speechStyle,
    keyTraits: parsed.keyTraits,
    backstorySummary: parsed.backstorySummary,
    safeDepictionNote: parsed.safeDepictionNote,
    gender: parsed.gender || characterGender || "neutral",
  } as CharacterInfo;
}

export async function generateChatReply(
  characterName: string,
  characterInfo: CharacterInfo,
  childProfile: ChildProfile,
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

  const interestsLine = childProfile.interests.length > 0
    ? `\n- Interests: ${childProfile.interests.join(", ")} (weave these into conversation naturally when relevant)`
    : "";

  const commLine = childProfile.communicationLevel
    ? `\n- Communication level: ${childProfile.communicationLevel} (adapt vocabulary and sentence complexity accordingly)`
    : "";

  const personalityLine = childProfile.personalityType
    ? `\n- Child's personality: ${childProfile.personalityType} (adjust your energy and approach to match)`
    : "";

  const colorLine = childProfile.favoriteColor
    ? `\n- Favorite color: ${childProfile.favoriteColor} (reference occasionally in descriptions)`
    : "";

  const sensitivitiesBlock = childProfile.sensitivities && childProfile.sensitivities.length > 0
    ? `\n- SENSITIVE TOPICS TO AVOID: ${childProfile.sensitivities.join(", ")} — NEVER bring these up or reference them even indirectly`
    : "";

  const prompt = `You are ${characterName}, a storybook character companion for a ${childProfile.age}-year-old child named ${childProfile.name}.

YOUR CHARACTER:
- Personality: ${characterInfo.personality}
- Speech style: ${characterInfo.speechStyle}
- Key traits: ${characterInfo.keyTraits.join(", ")}
- Backstory: ${characterInfo.backstorySummary || "A friendly character from a magical storybook world"}

CHILD PROFILE:
- Name: ${childProfile.name}
- Age: ${childProfile.age}${interestsLine}${commLine}${personalityLine}${colorLine}

EMOTIONAL CONTEXT (from analysis):
- Child's current mood: ${emotionContext.currentMood}
- Recommended tone: ${emotionContext.recommendedTone}
- Suggested approach: ${emotionContext.suggestedApproach}

CONVERSATION SO FAR:
${historyStr || "(This is the start of the conversation)"}

CHILD'S MESSAGE: "${kidMessage}"

RULES:
- Stay in character as ${characterName} at all times
- Use age-appropriate language for a ${childProfile.age}-year-old${commLine ? ` with ${childProfile.communicationLevel} communication level` : ""}
- Be warm, supportive, and emotionally validating
- Keep response under ${childProfile.age <= 5 ? "2" : childProfile.age <= 8 ? "3" : "5"} sentences
- Never mention being an AI or break character
- Never share personal information or encourage risky behavior
- If the child seems upset, be extra gentle and reassuring
- Match the recommended tone from the emotional context
- When natural, reference the child's interests to build connection${sensitivitiesBlock}

Respond as ${characterName}:`;

  return callGemini(prompt);
}

export async function analyzeMediaCharacters(
  mediaTitle: string,
  mediaType: "cartoon" | "movie" | "book" | "game"
): Promise<{ name: string; description: string; gender: CharacterGender }[]> {
  const prompt = `Analyze the ${mediaType} titled "${mediaTitle}" and return its main characters.

Return ONLY a JSON array (no markdown, no explanation) of the main characters (up to 8). Each element should have:
{
  "name": "Character's name",
  "description": "A brief, child-safe description of the character (1 sentence)",
  "gender": "male" or "female" or "neutral"
}

Only include characters that would be appropriate and safe for children aged 2-12 to interact with. Exclude any villains or characters associated with violence or fear.

Return the JSON array:`;

  const text = await callGemini(prompt);
  const cleaned = text.replace(/```json\n?|\n?```/g, "").trim();
  return JSON.parse(cleaned);
}
