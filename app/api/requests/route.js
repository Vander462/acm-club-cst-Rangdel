import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { db } from "@/lib/db";
import { getService, calcCost } from "@/lib/services";

export const dynamic = "force-dynamic";

// Public list: only active requests, with no contact details.
// Completed requests are visible to the admin only.
export async function GET() {
  const rows = db
    .prepare(
      "SELECT code, service_name, name, status, created_at FROM requests WHERE status != 'completed' ORDER BY created_at DESC LIMIT 100"
    )
    .all();
  const requests = rows.map((r) => ({
    code: r.code,
    serviceName: r.service_name,
    firstName: r.name.split(" ")[0],
    status: r.status,
    createdAt: r.created_at,
  }));
  return NextResponse.json({ requests });
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
  if (!service) {
    return NextResponse.json({ errors: { service: "Choose a service." } }, { status: 400 });
  }

  const name = str(b.name, 80);
  const studentId = str(b.studentId, 20);
  const phone = str(b.phone, 20);
  const place = str(b.place, 120);
  const preferredDate = str(b.preferredDate, 10);
  const laptopModel = str(b.laptopModel, 80);
  const notes = str(b.notes, 500);
  const version = str(b.version, 40);
  const software = str(b.software, 500);

  const errors = {};
  if (!name) errors.name = "Enter your full name.";
  if (!/^[A-Za-z0-9]{5,12}$/.test(studentId)) errors.studentId = "Enter your student ID.";
  if (!/^\+?[\d\s-]{8,14}$/.test(phone)) errors.phone = "Enter a phone number we can reach.";
  if (!place) errors.place = "Tell us where to meet you.";
  if (preferredDate && !/^\d{4}-\d{2}-\d{2}$/.test(preferredDate)) errors.preferredDate = "Use a valid date.";

  let quantity = 1;
  let details = version;
  if (service.id === "install-software") {
    quantity = Math.floor(Number(b.quantity));
    if (!(quantity >= 1 && quantity <= 20)) errors.quantity = "Enter a number from 1 to 20.";
    if (!software) errors.software = "List the software you need.";
    details = `${quantity} program(s): ${software.replace(/\s*\n\s*/g, ", ")}`;
  }
  if (service.id === "install-windows" && b.backedUp !== true) {
    errors.backedUp = "Confirm that you backed up your files.";
  }

  if (Object.keys(errors).length) return NextResponse.json({ errors }, { status: 400 });

  // The price is always calculated here, never taken from the browser.
  const cost = calcCost(service.id, quantity);
  const now = Date.now();
  const insert = db.prepare(`
    INSERT INTO requests (code, service, service_name, name, student_id, phone, place,
      preferred_date, laptop_model, notes, details, quantity, cost, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
  `);

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = newCode();
    try {
      insert.run(code, service.id, service.name, name, studentId, phone, place,
        preferredDate, laptopModel, notes, details, quantity, cost, now, now);
      return NextResponse.json({ code, cost }, { status: 201 });
    } catch (e) {
      if (!String(e.message).includes("UNIQUE")) throw e;
    }
  }
  return NextResponse.json({ error: "Could not create the request. Try again." }, { status: 500 });
}
