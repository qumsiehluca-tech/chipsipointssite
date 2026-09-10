import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set("cp_pw", "", { path: "/", maxAge: 0 });
  res.cookies.set("cp_role", "", { path: "/", maxAge: 0 });
  return res;
}
