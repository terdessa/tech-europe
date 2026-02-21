import type {
  User,
  Child,
  Message,
  Mission,
  DailyAnalytics,
  Alert,
} from "@/types/domain";

async function api<T>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(url, opts);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `API error ${res.status}`);
  }
  return res.json();
}

// ─── Users ────────────────────────────────────────────
export async function getUser(uid: string): Promise<User | null> {
  return api<User | null>(`/api/db/users/${uid}`);
}

export async function setUser(uid: string, data: Partial<User>) {
  await api(`/api/db/users/${uid}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

// ─── Children ─────────────────────────────────────────
export async function getChild(childId: string): Promise<Child | null> {
  return api<Child | null>(`/api/db/children/${childId}`);
}

export async function getChildrenForParent(parentId: string): Promise<Child[]> {
  return api<Child[]>(`/api/db/children?parentId=${parentId}`);
}

export async function createChild(
  data: Omit<Child, "id" | "createdAt">
): Promise<string> {
  const result = await api<{ id: string }>("/api/db/children", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return result.id;
}

// ─── Messages ─────────────────────────────────────────
export async function addMessage(
  childId: string,
  data: Omit<Message, "id" | "createdAt">
): Promise<string> {
  const result = await api<{ id: string }>(`/api/db/messages/${childId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return result.id;
}

export async function getRecentMessages(
  childId: string,
  count = 20
): Promise<Message[]> {
  return api<Message[]>(`/api/db/messages/${childId}?count=${count}`);
}

export async function getAllMessages(childId: string): Promise<Message[]> {
  return api<Message[]>(`/api/db/messages/${childId}?all=true`);
}

// ─── Missions ─────────────────────────────────────────
export async function getMissions(childId: string): Promise<Mission[]> {
  return api<Mission[]>(`/api/db/missions/${childId}`);
}

export async function addMission(
  childId: string,
  data: Omit<Mission, "id" | "createdAt">
): Promise<string> {
  const result = await api<{ id: string }>(`/api/db/missions/${childId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return result.id;
}

export async function updateMission(
  childId: string,
  missionId: string,
  data: Partial<Mission>
) {
  await api(`/api/db/missions/${childId}/${missionId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

// ─── Daily Analytics ──────────────────────────────────
export async function getDailyAnalytics(
  childId: string,
  dateKey: string
): Promise<DailyAnalytics | null> {
  return api<DailyAnalytics | null>(
    `/api/db/analytics/${childId}/${dateKey}`
  );
}

export async function getRecentDailyAnalytics(
  childId: string,
  days = 7
): Promise<{ date: string; data: DailyAnalytics }[]> {
  return api<{ date: string; data: DailyAnalytics }[]>(
    `/api/db/analytics/${childId}?days=${days}`
  );
}

// ─── Alerts ───────────────────────────────────────────
export async function getAlerts(childId: string): Promise<Alert[]> {
  return api<Alert[]>(`/api/db/alerts/${childId}`);
}
