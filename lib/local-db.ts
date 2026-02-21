import fs from "fs";
import path from "path";
import crypto from "crypto";

const DB_PATH = path.join(process.cwd(), ".local-db.json");

export interface DbSchema {
  users: Record<string, Record<string, unknown>>;
  children: Record<string, Record<string, unknown>>;
  messages: Record<string, Record<string, Record<string, unknown>>>; // messages[childId][msgId]
  missions: Record<string, Record<string, Record<string, unknown>>>; // missions[childId][missionId]
  analytics: Record<string, Record<string, Record<string, unknown>>>; // analytics[childId][dateKey]
  alerts: Record<string, Record<string, Record<string, unknown>>>; // alerts[childId][alertId]
}

function loadDb(): DbSchema {
  try {
    if (fs.existsSync(DB_PATH)) {
      const raw = fs.readFileSync(DB_PATH, "utf-8");
      return JSON.parse(raw);
    }
  } catch {
    // Corrupted file; start fresh
  }
  return {
    users: {},
    children: {},
    messages: {},
    missions: {},
    analytics: {},
    alerts: {},
  };
}

function saveDb(db: DbSchema) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
}

export function genId(): string {
  return crypto.randomBytes(12).toString("hex");
}

// ─── Users ────────────────────────────────────────────
export function dbGetUser(uid: string): Record<string, unknown> | null {
  const db = loadDb();
  return db.users[uid] ?? null;
}

export function dbSetUser(uid: string, data: Record<string, unknown>) {
  const db = loadDb();
  db.users[uid] = { ...(db.users[uid] || {}), ...data };
  saveDb(db);
}

export function dbFindUserByEmail(email: string): { uid: string; data: Record<string, unknown> } | null {
  const db = loadDb();
  for (const [uid, userData] of Object.entries(db.users)) {
    if (userData.email === email) return { uid, data: userData };
  }
  return null;
}

// ─── Children ─────────────────────────────────────────
export function dbGetChild(childId: string): Record<string, unknown> | null {
  const db = loadDb();
  return db.children[childId] ? { id: childId, ...db.children[childId] } : null;
}

export function dbGetChildrenForParent(parentId: string): Record<string, unknown>[] {
  const db = loadDb();
  return Object.entries(db.children)
    .filter(([, child]) => child.parentId === parentId)
    .map(([id, child]): Record<string, unknown> => ({ id, ...child }))
    .sort(
      (a, b) =>
        new Date(b.createdAt as string).getTime() -
        new Date(a.createdAt as string).getTime()
    );
}

export function dbCreateChild(data: Record<string, unknown>): string {
  const db = loadDb();
  const id = genId();
  db.children[id] = { ...data, createdAt: new Date().toISOString() };
  saveDb(db);
  return id;
}

const ALLOWED_CHILD_UPDATE_KEYS = [
  "name",
  "age",
  "interests",
  "language",
  "communicationLevel",
  "personalityType",
  "sensitivities",
  "favoriteColor",
  "characterImageUrl",
] as const;

export function dbSetChild(
  childId: string,
  data: Record<string, unknown>
): void {
  const db = loadDb();
  const existing = db.children[childId];
  if (!existing) return;

  const filtered: Record<string, unknown> = {};
  for (const key of ALLOWED_CHILD_UPDATE_KEYS) {
    if (key in data) filtered[key] = data[key];
  }
  db.children[childId] = { ...existing, ...filtered };
  saveDb(db);
}

// ─── Messages ─────────────────────────────────────────
export function dbAddMessage(
  childId: string,
  data: Record<string, unknown>
): string {
  const db = loadDb();
  if (!db.messages[childId]) db.messages[childId] = {};
  const id = genId();
  db.messages[childId][id] = {
    ...data,
    createdAt: new Date().toISOString(),
  };
  saveDb(db);
  return id;
}

export function dbUpdateMessage(
  childId: string,
  msgId: string,
  data: Record<string, unknown>
) {
  const db = loadDb();
  if (db.messages[childId]?.[msgId]) {
    db.messages[childId][msgId] = {
      ...db.messages[childId][msgId],
      ...data,
    };
    saveDb(db);
  }
}

export function dbGetRecentMessages(
  childId: string,
  count: number
): Record<string, unknown>[] {
  const db = loadDb();
  const msgs = db.messages[childId] || {};
  return Object.entries(msgs)
    .map(([id, m]): Record<string, unknown> => ({ id, ...m }))
    .sort(
      (a, b) =>
        new Date(a.createdAt as string).getTime() -
        new Date(b.createdAt as string).getTime()
    )
    .slice(-count);
}

export function dbGetAllMessages(
  childId: string
): Record<string, unknown>[] {
  const db = loadDb();
  const msgs = db.messages[childId] || {};
  return Object.entries(msgs)
    .map(([id, m]): Record<string, unknown> => ({ id, ...m }))
    .sort(
      (a, b) =>
        new Date(a.createdAt as string).getTime() -
        new Date(b.createdAt as string).getTime()
    );
}

// ─── Missions ─────────────────────────────────────────
export function dbGetMissions(
  childId: string
): Record<string, unknown>[] {
  const db = loadDb();
  const items = db.missions[childId] || {};
  return Object.entries(items)
    .map(([id, m]): Record<string, unknown> => ({ id, ...m }))
    .sort(
      (a, b) =>
        new Date(b.createdAt as string).getTime() -
        new Date(a.createdAt as string).getTime()
    );
}

export function dbAddMission(
  childId: string,
  data: Record<string, unknown>
): string {
  const db = loadDb();
  if (!db.missions[childId]) db.missions[childId] = {};
  const id = genId();
  db.missions[childId][id] = {
    ...data,
    createdAt: new Date().toISOString(),
  };
  saveDb(db);
  return id;
}

export function dbUpdateMission(
  childId: string,
  missionId: string,
  data: Record<string, unknown>
) {
  const db = loadDb();
  if (db.missions[childId]?.[missionId]) {
    db.missions[childId][missionId] = {
      ...db.missions[childId][missionId],
      ...data,
    };
    saveDb(db);
  }
}

// ─── Daily Analytics ──────────────────────────────────
export function dbGetDailyAnalytics(
  childId: string,
  dateKey: string
): Record<string, unknown> | null {
  const db = loadDb();
  return db.analytics[childId]?.[dateKey] ?? null;
}

export function dbSetDailyAnalytics(
  childId: string,
  dateKey: string,
  data: Record<string, unknown>
) {
  const db = loadDb();
  if (!db.analytics[childId]) db.analytics[childId] = {};
  db.analytics[childId][dateKey] = {
    ...(db.analytics[childId][dateKey] || {}),
    ...data,
    updatedAt: new Date().toISOString(),
  };
  saveDb(db);
}

export function dbGetRecentAnalytics(
  childId: string,
  days: number
): { date: string; data: Record<string, unknown> }[] {
  const results: { date: string; data: Record<string, unknown> }[] = [];
  const today = new Date();
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    const data = dbGetDailyAnalytics(childId, key);
    if (data) results.push({ date: key, data });
  }
  return results.reverse();
}

// ─── Alerts ───────────────────────────────────────────
export function dbGetAlerts(
  childId: string
): Record<string, unknown>[] {
  const db = loadDb();
  const items = db.alerts[childId] || {};
  return Object.entries(items)
    .map(([id, a]): Record<string, unknown> => ({ id, ...a }))
    .sort(
      (a, b) =>
        new Date(b.createdAt as string).getTime() -
        new Date(a.createdAt as string).getTime()
    );
}

export function dbAddAlert(
  childId: string,
  data: Record<string, unknown>
): string {
  const db = loadDb();
  if (!db.alerts[childId]) db.alerts[childId] = {};
  const id = genId();
  db.alerts[childId][id] = {
    ...data,
    createdAt: new Date().toISOString(),
  };
  saveDb(db);
  return id;
}

// ─── Query helpers for pipelines ──────────────────────
export function dbGetActiveMissions(
  childId: string
): Record<string, unknown>[] {
  return dbGetMissions(childId).filter((m) => m.status === "active");
}
