interface CodeWordsPayload {
  [key: string]: unknown;
}

async function triggerCodeWords(
  webhookUrl: string,
  payload: CodeWordsPayload
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const body = await res.text();
      return { success: false, error: `CodeWords error (${res.status}): ${body}` };
    }

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
  const url = process.env.CODEWORDS_ALERT_WEBHOOK;
  if (!url) return SKIPPED;
  return triggerCodeWords(url, payload);
}

export async function sendMissionNotification(payload: {
  childName: string;
  missionTitle: string;
  missionDescription: string;
  source: string;
}) {
  const url = process.env.CODEWORDS_MISSION_WEBHOOK;
  if (!url) return SKIPPED;
  return triggerCodeWords(url, payload);
}

export async function sendWeeklyDigest(payload: {
  parentEmail: string;
  childName: string;
  narrative: string;
  highlights: string[];
  concerns: string[];
  nextSteps: string[];
}) {
  const url = process.env.CODEWORDS_WEEKLY_DIGEST_WEBHOOK;
  if (!url) return SKIPPED;
  return triggerCodeWords(url, payload);
}

export async function sendReengagement(payload: {
  parentEmail: string;
  childName: string;
  daysSinceLastChat: number;
}) {
  const url = process.env.CODEWORDS_REENGAGE_WEBHOOK;
  if (!url) return SKIPPED;
  return triggerCodeWords(url, payload);
}

export async function sendMonthlyReport(payload: {
  parentEmail: string;
  childName: string;
  reportData: Record<string, unknown>;
}) {
  const url = process.env.CODEWORDS_MONTHLY_REPORT_WEBHOOK;
  if (!url) return SKIPPED;
  return triggerCodeWords(url, payload);
}
