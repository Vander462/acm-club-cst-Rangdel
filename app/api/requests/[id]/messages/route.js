import { NextResponse } from "next/server";
import { getById, getMessages, addMessage } from "@/lib/db";
import { isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";
const clean = (v, n) => String(v ?? "").trim().slice(0, n);

function authorized(req, row) {
  if (isAdmin()) return { role: "admin", name: clean(req.headers.get("x-admin-name") || "ACM In-charge", 80) };
  const { searchParams } = new URL(req.url);
  const sid = clean(searchParams.get("studentId"), 20);
  const phone = clean(searchParams.get("phone"), 20).replace(/[^+\d]/g, "").replace(/^\+/, "");
  const savedPhone = String(row.phone || "").replace(/[^+\d]/g, "").replace(/^\+/, "");
  return sid === row.studentId && phone && phone === savedPhone ? { role: "student", name: row.name } : null;
}

export async function GET(req, { params }) {
  const row = await getById(Number(params.id));
  if (!row) return NextResponse.json({ error: "Request not found." }, { status: 404 });
  if (!authorized(req, row)) return NextResponse.json({ error: "Not authorised." }, { status: 401 });
  const messages = await getMessages(row.id);
  return NextResponse.json({ messages });
}

export async function POST(req, { params }) {
  const row = await getById(Number(params.id));
  if (!row) return NextResponse.json({ error: "Request not found." }, { status: 404 });
  const sender = authorized(req, row);
  if (!sender) return NextResponse.json({ error: "Not authorised." }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const message = clean(body.message, 1000);
  if (!message) return NextResponse.json({ error: "Write a message first." }, { status: 400 });
  await addMessage({
    request_id: row.id,
    sender_role: sender.role,
    sender_name: sender.name,
    message,
  });
  return NextResponse.json({ ok: true }, { status: 201 });
}
