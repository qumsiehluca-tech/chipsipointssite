import { cookies } from "next/headers";
import type { Brother, PointValue, Role } from "./types";

// ---------------------------------------------------------------------------
// DATA SOURCE
//
// This is the only file that talks to the points backend. Every page reads
// through getBrothers() / getBrotherBySlug() / getPointValues() — never add
// a fetch call directly in a page component.
//
// Once google-apps-script/Code.gs is deployed as a Web App, set its /exec
// URL as SHEETS_API_URL (in .env.local, and in Vercel's project env vars).
// Until then, this falls back to mock data + two hardcoded dev passwords
// ("admin" / "viewer") so the site is usable end-to-end without the sheet.
// ---------------------------------------------------------------------------

const SHEETS_API_URL = process.env.SHEETS_API_URL;

type ApiPayload = {
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

// Mutable only so the admin panel is testable against `next dev` without a
// live Apps Script deployment. Resets whenever the dev server restarts.
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

function getSessionPassword(): string | null {
  return cookies().get("cp_pw")?.value ?? null;
}

export function getSessionRole(): Role | null {
  const role = cookies().get("cp_role")?.value;
  return role === "admin" || role === "viewer" ? role : null;
}

async function fetchFromSheet(password: string): Promise<ApiPayload | null> {
  if (!SHEETS_API_URL) return null;
  try {
    const res = await fetch(`${SHEETS_API_URL}?password=${encodeURIComponent(password)}`, {
      cache: "no-store"
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.error) return null;
    return data as ApiPayload;
  } catch {
    return null;
  }
}

/** Checks a password against the backend (or dev fallback) and returns its role, or null. */
export async function verifyPassword(password: string): Promise<Role | null> {
  if (!SHEETS_API_URL) {
    if (password === "admin") return "admin";
    if (password === "viewer") return "viewer";
    return null;
  }
  const data = await fetchFromSheet(password);
  return data?.role ?? null;
}

export async function getBrothers(): Promise<Brother[]> {
  const password = getSessionPassword();
  if (password) {
    const data = await fetchFromSheet(password);
    if (data) return data.brothers;
  }
  return mockBrothers();
}

export async function getBrotherBySlug(slug: string): Promise<Brother | undefined> {
  const brothers = await getBrothers();
  return brothers.find((b) => b.slug === slug);
}

export async function getPointValues(): Promise<PointValue[]> {
  const password = getSessionPassword();
  if (password) {
    const data = await fetchFromSheet(password);
    if (data?.pointValues) return data.pointValues;
  }
  return MOCK_POINT_VALUES;
}

type NewLogEntry = {
  name: string;
  action: string;
  points: number;
  notes?: string;
  loggedBy?: string;
};

/** Admin-only: appends rows to the Log sheet via the Apps Script backend. Returns the refreshed roster, or null if a live password isn't present. */
export async function submitLogEntries(entries: NewLogEntry[]): Promise<Brother[] | null> {
  const password = getSessionPassword();
  if (!password) return null;

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
