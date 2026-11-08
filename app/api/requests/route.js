import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { listAll, createRequest } from "@/lib/db";
import { getService as getServiceFromServices, calcCost as calcCostFromServices } from "@/lib/services";

export const dynamic = "force-dynamic";

// Public list: only active requests, with no contact details.
// Completed requests are visible to the admin only.
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const studentId = String(searchParams.get("studentId") || "").trim();
  const phone = String(searchParams.get("phone") || "").replace(/[^+\d]/g, "");
  if (!studentId || !phone) return NextResponse.json({ requests: [] });
  const allRequests = await listAll();
  const filtered = allRequests.filter(
    (r) =>
      r.studentId === studentId &&
      r.phone.replace(/[^+\d]/g, "") === phone.replace(/[^+\d]/g, "")
  );
  return NextResponse.json({ requests: filtered });
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
  const service = getServiceFromServices(b.service);
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
  const quantity = 1, cost = Number.isFinite(Number(b.cost)) ? Math.max(0, Math.min(100000, Math.floor(Number(b.cost)))) : calcCostFromServices(service.id, quantity);
  const now = Date.now(), details = software;
  
  const allRequests = await listAll();
  const existingCodes = new Set(allRequests.map((r) => r.code));
  
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = newCode();
    if (!existingCodes.has(code)) {
      const newReq = await createRequest({
        code,
        service: service.id,
        service_name: service.name,
        name,
        student_id: studentId,
        phone,
        place: "",
        preferred_date: preferredDate,
        laptop_model: "",
        notes: "",
        details,
        quantity,
        cost,
        status: "pending",
        admin_note: "",
        created_at: now,
        updated_at: now,
      });
      return NextResponse.json({ id: newReq.id, code, cost }, { status: 201 });
    }
  }
  return NextResponse.json({ error: "Could not create the request. Try again." }, { status: 500 });
}
