import { NextResponse } from "next/server";
import { verifyPassword } from "@/lib/data";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const password = body?.password;
  if (!password || typeof password !== "string") {
    return NextResponse.json({ error: "missing password" }, { status: 400 });
  }

  const role = await verifyPassword(password);
  if (!role) {
    return NextResponse.json({ error: "invalid password" }, { status: 401 });
  }

  const res = NextResponse.json({ role });
  const cookieOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 30
  };
  res.cookies.set("cp_pw", password, cookieOpts);
  res.cookies.set("cp_role", role, cookieOpts);
  return res;
}
