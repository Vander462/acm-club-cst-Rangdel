import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { db } from "@/lib/db";
import { getService, calcCost } from "@/lib/services";

export const dynamic = "force-dynamic";

// Public list: only active requests, with no contact details.
// Completed requests are visible to the admin only.
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const studentId = String(searchParams.get("studentId") || "").trim();
  const phone = String(searchParams.get("phone") || "").replace(/[^+\d]/g, "");
  if (!studentId || !phone) return NextResponse.json({ requests: [] });
  const rows = db.prepare(
    "SELECT * FROM requests WHERE student_id = ? AND REPLACE(REPLACE(REPLACE(phone, ' ', ''), '-', ''), '+', '') = REPLACE(?, '+', '') ORDER BY created_at DESC"
  ).all(studentId, phone);
  return NextResponse.json({ requests: rows.map((r) => ({
    id: r.id, code: r.code, serviceName: r.service_name, name: r.name, studentId: r.student_id,
    phone: r.phone, status: r.status, cost: r.cost, preferredDate: r.preferred_date,
    incharge: r.incharge || "", createdAt: r.created_at, updatedAt: r.updated_at
  })) });
}

const str = (v, max) => String(v ?? "").trim().slice(0, max);

function newCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (const b of crypto.randomBytes(4)) out += chars[b % chars.length];
  return "ZB-" + out;
}

export async function POST(req) {
  const b = await req.json().catch(() => null);
  if (!b) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const service = getService(b.service);
  if (!service) return NextResponse.json({ errors: { service: "Choose a service." } }, { status: 400 });
  const name = str(b.name, 80), studentId = str(b.studentId, 20);
  const phone = str(b.phone, 20), preferredDate = str(b.preferredDate, 10);
  const software = str(b.software, 500);
  const errors = {};
  if (!name) errors.name = "Enter your full name.";
  if (!/^[A-Za-z0-9-]{5,20}$/.test(studentId)) errors.studentId = "Enter your student ID.";
  if (!/^\+?[\d\s-]{8,18}$/.test(phone)) errors.phone = "Enter a valid contact number.";
  if (!software) errors.software = "Enter the software you need.";
  if (preferredDate && !/^\d{4}-\d{2}-\d{2}$/.test(preferredDate)) errors.preferredDate = "Use a valid date.";
  if (Object.keys(errors).length) return NextResponse.json({ errors }, { status: 400 });
  const quantity = 1, cost = Number.isFinite(Number(b.cost)) ? Math.max(0, Math.min(100000, Math.floor(Number(b.cost)))) : calcCost(service.id, quantity);
  const now = Date.now(), details = software;
  const insert = db.prepare(`INSERT INTO requests
    (code, service, service_name, name, student_id, phone, place, preferred_date, laptop_model, notes, details, quantity, cost, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, '', ?, '', '', ?, ?, ?, 'pending', ?, ?)`);
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = newCode();
    try {
      const result = insert.run(code, service.id, service.name, name, studentId, phone, preferredDate, details, quantity, cost, now, now);
      return NextResponse.json({ id: Number(result.lastInsertRowid), code, cost }, { status: 201 });
    } catch (e) { if (!String(e.message).includes("UNIQUE")) throw e; }
  }
  return NextResponse.json({ error: "Could not create the request. Try again." }, { status: 500 });
}
