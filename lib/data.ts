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

const MOCK_POINT_VALUES: PointValue[] = [
  { type: "Gain", action: "Bringing a PNM who accepts a bid to Lodge", points: 5 },
  { type: "Gain", action: "Holding a non-exec position", points: 2.5 },
  { type: "Loss", action: "Missing weekly Alpha meeting without excuse", points: -3 }
];

type MockLogRow = { name: string; date: string; action: string; points: number; notes?: string; loggedBy?: string };

// Mutable only so the admin panel is testable in `next dev` without a live
// Apps Script deployment. Lives in memory, so it resets on every page load.
const mockLog: MockLogRow[] = [
  {
    name: "Example Brother",
    date: "2026-08-25",
    action: "Bringing a PNM who accepts a bid to Lodge",
    points: 5,
    notes: "Example row — replace once the Log sheet is live",
    loggedBy: "Admin"
  },
  { name: "Example Brother", date: "2026-08-28", action: "Holding a non-exec position", points: 2.5, loggedBy: "Admin" },
  { name: "Lorenzo Patrizio", date: "2026-08-21", action: "Exceptional Contributor bonus", points: 25, loggedBy: "Admin" }
];

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function mockBrothers(): Brother[] {
  const byName = new Map<string, MockLogRow[]>();
  for (const row of mockLog) {
    if (!byName.has(row.name)) byName.set(row.name, []);
    byName.get(row.name)!.push(row);
  }

  const brothers: Brother[] = Array.from(byName.entries()).map(([name, rows]) => ({
    slug: slugify(name),
    name,
    total: rows.reduce((sum, h) => sum + h.points, 0),
    history: [...rows].sort((a, c) => (a.date < c.date ? 1 : -1))
  }));
  return brothers.sort((a, b) => b.total - a.total);
}

/** Checks a password against the backend (or dev fallback) and returns the full payload, or null if invalid. */
export async function fetchAuthed(password: string): Promise<ApiPayload | null> {
  if (!SHEETS_API_URL) {
    if (password === "admin") return { role: "admin", brothers: mockBrothers(), pointValues: MOCK_POINT_VALUES };
    if (password === "viewer") return { role: "viewer", brothers: mockBrothers() };
    return null;
  }
  try {
    const res = await fetch(`${SHEETS_API_URL}?password=${encodeURIComponent(password)}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.error) return null;
    return data as ApiPayload;
  } catch {
    return null;
  }
}

type NewLogEntry = {
  name: string;
  action: string;
  points: number;
  notes?: string;
  loggedBy?: string;
};

/** Admin-only: appends rows to the Log sheet via the Apps Script backend. Returns the refreshed roster, or null on failure. */
export async function postLogEntries(password: string, entries: NewLogEntry[]): Promise<Brother[] | null> {
  if (!SHEETS_API_URL) {
    const today = new Date().toISOString().slice(0, 10);
    for (const e of entries) {
      mockLog.push({ name: e.name, date: today, action: e.action, points: e.points, notes: e.notes, loggedBy: e.loggedBy });
    }
    return mockBrothers();
  }

  try {
    const res = await fetch(SHEETS_API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ password, entries })
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.error) return null;
    return data.brothers as Brother[];
  } catch {
    return null;
  }
}
