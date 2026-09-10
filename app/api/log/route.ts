import { NextResponse } from "next/server";
import { getSessionRole, submitLogEntries } from "@/lib/data";

export async function POST(request: Request) {
  if (getSessionRole() !== "admin") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const entries = body?.entries;
  if (!Array.isArray(entries) || entries.length === 0) {
    return NextResponse.json({ error: "no entries" }, { status: 400 });
  }
  for (const e of entries) {
    if (!e.name || !e.action || typeof e.points !== "number") {
      return NextResponse.json({ error: "each entry needs name, action, and points" }, { status: 400 });
    }
  }

  const brothers = await submitLogEntries(entries);
  if (!brothers) {
    return NextResponse.json({ error: "couldn't reach the points backend" }, { status: 503 });
  }
  return NextResponse.json({ ok: true, brothers });
}
