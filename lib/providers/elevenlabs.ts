const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY!;
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID!;
const BASE_URL = "https://api.elevenlabs.io/v1";

export async function textToSpeech(text: string): Promise<ArrayBuffer> {
  const res = await fetch(
    `${BASE_URL}/text-to-speech/${ELEVENLABS_VOICE_ID}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.6,
          similarity_boost: 0.75,
          style: 0.3,
        },
      }),
    }
  );

  if (!res.ok) {
    throw new Error(`ElevenLabs TTS error: ${res.status} ${await res.text()}`);
  }

  return res.arrayBuffer();
}

export async function speechToText(audioBuffer: ArrayBuffer): Promise<string> {
  const formData = new FormData();
  formData.append(
    "audio",
    new Blob([audioBuffer], { type: "audio/webm" }),
    "audio.webm"
  );
  formData.append("model_id", "scribe_v1");

  const res = await fetch(`${BASE_URL}/speech-to-text`, {
    method: "POST",
    headers: {
      "xi-api-key": ELEVENLABS_API_KEY,
    },
    body: formData,
  });

  if (!res.ok) {
    throw new Error(`ElevenLabs STT error: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  return data.text || "";
}
