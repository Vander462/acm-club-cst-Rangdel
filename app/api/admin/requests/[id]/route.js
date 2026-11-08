import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { getById, updateRequest } from "@/lib/db";

export const dynamic = "force-dynamic";

const fail = (error, status = 400) => NextResponse.json({ error }, { status });

// Admin-only. Students have no endpoint that can change a request.
export async function PATCH(req, { params }) {
  if (!isAdmin()) return fail("Not signed in.", 401);

  const id = Number(params.id);
  const row = Number.isInteger(id) ? await getById(id) : null;
  if (!row) return fail("Request not found.", 404);

  const b = await req.json().catch(() => null);
  if (!b) return fail("Invalid request.");
  const now = Date.now();

  // Confirm: mark the request completed. This locks it against further edits.
  if (b.action === "confirm") {
    if (row.status === "completed") return fail("Already confirmed.", 409);
    const updated = await updateRequest(id, { status: "completed", confirmed_at: now });
    return NextResponse.json({ request: updated });
  }

  // Reopen: unlock a completed request so it can be edited again.
  if (b.action === "reopen") {
    if (row.status !== "completed") return fail("Request is not completed.", 409);
    const updated = await updateRequest(id, { status: "in_progress", confirmed_at: null });
    return NextResponse.json({ request: updated });
  }

  // Normal edits are refused while a request is completed.
  if (row.status === "completed") return fail("This request is completed. Reopen it to edit.", 423);

  const updates = {};

  if ("status" in b) {
    if (!["pending", "in_progress"].includes(b.status)) {
      return fail("Use the Confirm button to complete a request.");
    }
    updates.status = b.status;
    if (b.status === "in_progress" && !row.incharge) {
      updates.incharge = String(b.incharge || "ACM Club").trim().slice(0, 100);
    }
  }
  if ("cost" in b) {
    const c = Math.floor(Number(b.cost));
    if (!Number.isFinite(c) || c < 0 || c > 100000) return fail("Enter a valid cost.");
    updates.cost = c;
  }
  if ("incharge" in b) {
    updates.incharge = String(b.incharge ?? "").trim().slice(0, 100);
  }
  if ("adminNote" in b) {
    updates.admin_note = String(b.adminNote ?? "").trim().slice(0, 500);
  }
  if ("place" in b) {
    const p = String(b.place ?? "").trim().slice(0, 120);
    if (!p) return fail("Place cannot be empty.");
    updates.place = p;
  }
  if ("preferredDate" in b) {
    const d = String(b.preferredDate ?? "").trim();
    if (d && !/^\d{4}-\d{2}-\d{2}$/.test(d)) return fail("Use a valid date.");
    updates.preferred_date = d;
  }

  if (Object.keys(updates).length === 0) return fail("Nothing to change.");
  const updated = await updateRequest(id, updates);
  return NextResponse.json({ request: updated });
}
