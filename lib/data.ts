import type { Brother, PointValue, Role } from "./types";

// ---------------------------------------------------------------------------
// DATA SOURCE
//
// This is the only file that talks to the points backend. It runs entirely
// client-side (the site is statically exported for GitHub Pages, so there's
// no server to proxy through) — pages call these functions from useEffect
// after reading the stored password from lib/auth.ts.
//
// Once google-apps-script/Code.gs is deployed as a Web App, set its /exec
// URL as NEXT_PUBLIC_SHEETS_API_URL (build-time env var — it gets baked into
// the static bundle, which is fine: the URL alone grants no access, only a
// correct password does, and that's checked inside Code.gs, never here).
// Until then, this falls back to mock data + two dev passwords
// ("admin" / "viewer") so the site is usable end-to-end without the sheet.
// ---------------------------------------------------------------------------

const SHEETS_API_URL = process.env.NEXT_PUBLIC_SHEETS_API_URL;

export type ApiPayload = {
  role: Role;
  brothers: Brother[];
  pointValues?: PointValue[];
};

export type FetchResult =
  | { ok: true; data: ApiPayload }
  | { ok: false; reason: "unauthorized" | "network" };

export type WriteResult = { ok: true; brothers: Brother[] } | { ok: false; error: string };

/** URL-safe id for a brother, e.g. "Jordan Smith" -> "jordan-smith". Exported for tests. */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Combines the full roster with whoever already has a Log entry, without
 * duplicates. A brother with zero points (no history yet) must still show
 * up — this mirrors getBrothers_() in google-apps-script/Code.gs exactly;
 * if you change the merge logic there, change it here too.
 */
export function mergeRosterWithLog(roster: string[], logNames: string[]): string[] {
  const merged = [...roster];
  for (const name of logNames) {
    if (!merged.includes(name)) merged.push(name);
  }
  return merged;
}

const MOCK_POINT_VALUES: PointValue[] = [
  { type: "Gain", action: "Bringing a PNM who accepts a bid to Lodge", points: 5 },
  { type: "Gain", action: "Holding a non-exec position", points: 2.5 },
  { type: "Loss", action: "Missing weekly Alpha meeting without excuse", points: -3 }
];

type MockLogRow = {
  row: number;
  name: string;
  date: string;
  action: string;
  points: number;
  notes?: string;
  loggedBy?: string;
};

// Mutable only so the admin panel is testable in `next dev` without a live
// Apps Script deployment. Lives in memory, so it resets on every page load.
let mockNextRow = 100;
function nextMockRow() {
  return mockNextRow++;
}

const mockRoster: string[] = ["Example Brother", "Lorenzo Patrizio"];

const mockLog: MockLogRow[] = [
  {
    row: nextMockRow(),
    name: "Example Brother",
    date: "2026-08-25",
    action: "Bringing a PNM who accepts a bid to Lodge",
    points: 5,
    notes: "Example row — replace once the Log sheet is live",
    loggedBy: "Admin"
  },
  { row: nextMockRow(), name: "Example Brother", date: "2026-08-28", action: "Holding a non-exec position", points: 2.5, loggedBy: "Admin" },
  { row: nextMockRow(), name: "Lorenzo Patrizio", date: "2026-08-21", action: "Exceptional Contributor bonus", points: 25, loggedBy: "Admin" }
];

function mockBrothers(): Brother[] {
  const byName = new Map<string, MockLogRow[]>();
  for (const row of mockLog) {
    if (!byName.has(row.name)) byName.set(row.name, []);
    byName.get(row.name)!.push(row);
  }

  const allNames = mergeRosterWithLog(mockRoster, Array.from(byName.keys()));

  const brothers: Brother[] = allNames.map((name) => {
    const rows = [...(byName.get(name) || [])].sort((a, c) => (a.date < c.date ? 1 : -1));
    return {
      slug: slugify(name),
      name,
      total: rows.reduce((sum, h) => sum + h.points, 0),
      history: rows.map((r) => ({ row: r.row, date: r.date, action: r.action, points: r.points, notes: r.notes, loggedBy: r.loggedBy }))
    };
  });
  return brothers.sort((a, b) => b.total - a.total);
}

/** Checks a password against the backend (or dev fallback) and returns the full payload, or a reason it failed. */
export async function fetchAuthed(password: string): Promise<FetchResult> {
  if (!SHEETS_API_URL) {
    if (password === "admin") return { ok: true, data: { role: "admin", brothers: mockBrothers(), pointValues: MOCK_POINT_VALUES } };
    if (password === "viewer") return { ok: true, data: { role: "viewer", brothers: mockBrothers() } };
    return { ok: false, reason: "unauthorized" };
  }
  try {
    const res = await fetch(`${SHEETS_API_URL}?password=${encodeURIComponent(password)}`);
    if (!res.ok) return { ok: false, reason: "network" };
    const data = await res.json();
    if (data.error === "unauthorized") return { ok: false, reason: "unauthorized" };
    if (data.error) return { ok: false, reason: "network" };
    return { ok: true, data: data as ApiPayload };
  } catch {
    return { ok: false, reason: "network" };
  }
}

export type NewLogEntry = {
  name: string;
  action: string;
  points: number;
  notes?: string;
  loggedBy?: string;
  date?: string;
};

async function postAction(password: string, body: Record<string, unknown>): Promise<WriteResult> {
  if (!SHEETS_API_URL) {
    return mockPostAction(password, body);
  }
  try {
    const res = await fetch(SHEETS_API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ password, ...body })
    });
    if (!res.ok) return { ok: false, error: "couldn't reach the points backend" };
    const data = await res.json();
    if (data.error) return { ok: false, error: String(data.error).replace(/^Error:\s*/, "") };
    return { ok: true, brothers: data.brothers as Brother[] };
  } catch {
    return { ok: false, error: "couldn't reach the points backend" };
  }
}

function mockPostAction(password: string, body: Record<string, unknown>): WriteResult {
  if (password !== "admin") return { ok: false, error: "unauthorized" };
  const action = body.action;

  if (action === "log") {
    const entries = (body.entries as NewLogEntry[]) || [];
    const today = new Date().toISOString().slice(0, 10);
    for (const e of entries) {
      mockLog.push({ row: nextMockRow(), name: e.name, date: e.date || today, action: e.action, points: e.points, notes: e.notes, loggedBy: e.loggedBy });
    }
    return { ok: true, brothers: mockBrothers() };
  }

  if (action === "update") {
    const row = mockLog.find((r) => r.row === body.row);
    if (!row) return { ok: false, error: "entry not found" };
    const e = body.entry as NewLogEntry;
    row.name = e.name;
    row.date = e.date || row.date;
    row.action = e.action;
    row.points = Number(e.points) || 0;
    row.notes = e.notes;
    row.loggedBy = e.loggedBy;
    return { ok: true, brothers: mockBrothers() };
  }

  if (action === "delete") {
    const idx = mockLog.findIndex((r) => r.row === body.row);
    if (idx !== -1) mockLog.splice(idx, 1);
    return { ok: true, brothers: mockBrothers() };
  }

  if (action === "addBrother") {
    const name = String(body.name || "").trim();
    if (!name) return { ok: false, error: "missing name" };
    if (mockRoster.includes(name)) return { ok: false, error: "that brother is already on the roster" };
    mockRoster.push(name);
    return { ok: true, brothers: mockBrothers() };
  }

  return { ok: false, error: "unknown action" };
}

/** Admin-only: appends rows to the Log sheet via the Apps Script backend. */
export async function postLogEntries(password: string, entries: NewLogEntry[]): Promise<WriteResult> {
  return postAction(password, { action: "log", entries });
}

/** Admin-only: overwrites one existing Log row in place. */
export async function updateLogEntry(password: string, row: number, entry: NewLogEntry): Promise<WriteResult> {
  return postAction(password, { action: "update", row, entry });
}

/** Admin-only: removes one Log row entirely. */
export async function deleteLogEntry(password: string, row: number): Promise<WriteResult> {
  return postAction(password, { action: "delete", row });
}

/** Admin-only: adds a brand-new brother to the Leaderboard (and duplicates the Template tab for them). */
export async function addBrother(password: string, name: string): Promise<WriteResult> {
  return postAction(password, { action: "addBrother", name });
}
