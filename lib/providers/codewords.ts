const CODEWORDS_BASE = "https://runtime.codewords.ai";

interface CodeWordsPayload {
  [key: string]: unknown;
}

function getApiKey(): string {
  return process.env.CODEWORDS_API_KEY ?? "";
}

async function triggerCodeWords(
  serviceId: string,
  payload: CodeWordsPayload
): Promise<{ success: boolean; error?: string }> {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn("[codewords] No API key configured — skipping");
    return { success: true };
  }

  try {
    const res = await fetch(`${CODEWORDS_BASE}/run/${serviceId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error(`[codewords] Error (${res.status}):`, body.slice(0, 200));
      return { success: false, error: `CodeWords error (${res.status}): ${body}` };
    }

    console.log(`[codewords] Service ${serviceId} triggered successfully`);
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

const SKIPPED = { success: true } as const;

export async function sendAlert(payload: {
  childName: string;
  riskLevel: string;
  categories: string[];
  parentMessage: string;
  timestamp: string;
}) {
  const serviceId = process.env.CODEWORDS_ALERT_SERVICE_ID;
  if (!serviceId) return SKIPPED;
  return triggerCodeWords(serviceId, payload);
}

export async function sendMissionNotification(payload: {
  childName: string;
  missionTitle: string;
  missionDescription: string;
  source: string;
}) {
  const serviceId = process.env.CODEWORDS_MISSION_SERVICE_ID;
  if (!serviceId) return SKIPPED;
  return triggerCodeWords(serviceId, payload);
}

export async function sendWeeklyDigest(payload: {
  parentEmail: string;
  childName: string;
  narrative: string;
  highlights: string[];
  concerns: string[];
  nextSteps: string[];
}) {
  const serviceId = process.env.CODEWORDS_WEEKLY_DIGEST_SERVICE_ID;
  if (!serviceId) return SKIPPED;
  return triggerCodeWords(serviceId, payload);
}

export async function sendReengagement(payload: {
  parentEmail: string;
  childName: string;
  daysSinceLastChat: number;
}) {
  const serviceId = process.env.CODEWORDS_REENGAGE_SERVICE_ID;
  if (!serviceId) return SKIPPED;
  return triggerCodeWords(serviceId, payload);
}

export async function sendMonthlyReport(payload: {
  parentEmail: string;
  childName: string;
  reportData: Record<string, unknown>;
}) {
  const serviceId = process.env.CODEWORDS_MONTHLY_REPORT_SERVICE_ID;
  if (!serviceId) return SKIPPED;
  return triggerCodeWords(serviceId, payload);
}
