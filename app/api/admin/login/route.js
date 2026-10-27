import { NextResponse } from "next/server";
import { checkPassword, makeToken, COOKIE_NAME, cookieOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  if (!checkPassword(body.password)) {
    // Small delay makes password guessing slower
    await new Promise((r) => setTimeout(r, 600));
    return NextResponse.json({ error: "Wrong password." }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, makeToken(), cookieOptions);
  return res;
}
