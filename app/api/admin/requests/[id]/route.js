import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { db, getById } from "@/lib/db";

export const dynamic = "force-dynamic";

const fail = (error, status = 400) => NextResponse.json({ error }, { status });

// Admin-only. Students have no endpoint that can change a request.
export async function PATCH(req, { params }) {
  if (!isAdmin()) return fail("Not signed in.", 401);

  const id = Number(params.id);
  const row = Number.isInteger(id) ? getById(id) : null;
  if (!row) return fail("Request not found.", 404);

  const b = await req.json().catch(() => null);
  if (!b) return fail("Invalid request.");
  const now = Date.now();

  // Confirm: mark the request completed. This locks it against further edits.
  if (b.action === "confirm") {
    if (row.status === "completed") return fail("Already confirmed.", 409);
    db.prepare("UPDATE requests SET status='completed', confirmed_at=?, updated_at=? WHERE id=?").run(now, now, id);
    return NextResponse.json({ request: getById(id) });
  }

  // Reopen: unlock a completed request so it can be edited again.
  if (b.action === "reopen") {
    if (row.status !== "completed") return fail("Request is not completed.", 409);
    db.prepare("UPDATE requests SET status='in_progress', confirmed_at=NULL, updated_at=? WHERE id=?").run(now, id);
    return NextResponse.json({ request: getById(id) });
  }

  // Normal edits are refused while a request is completed.
  if (row.status === "completed") return fail("This request is completed. Reopen it to edit.", 423);

  const sets = [];
  const vals = [];

  if ("status" in b) {
    if (!["pending", "in_progress"].includes(b.status)) {
      return fail("Use the Confirm button to complete a request.");
    }
    sets.push("status=?");
    vals.push(b.status);
  }
  if ("cost" in b) {
    const c = Math.floor(Number(b.cost));
    if (!Number.isFinite(c) || c < 0 || c > 100000) return fail("Enter a valid cost.");
    sets.push("cost=?");
    vals.push(c);
  }
  if ("adminNote" in b) {
    sets.push("admin_note=?");
    vals.push(String(b.adminNote ?? "").trim().slice(0, 500));
  }
  if ("place" in b) {
    const p = String(b.place ?? "").trim().slice(0, 120);
    if (!p) return fail("Place cannot be empty.");
    sets.push("place=?");
    vals.push(p);
  }
  if ("preferredDate" in b) {
    const d = String(b.preferredDate ?? "").trim();
    if (d && !/^\d{4}-\d{2}-\d{2}$/.test(d)) return fail("Use a valid date.");
    sets.push("preferred_date=?");
    vals.push(d);
  }

  if (!sets.length) return fail("Nothing to change.");
  sets.push("updated_at=?");
  vals.push(now);
  db.prepare(`UPDATE requests SET ${sets.join(", ")} WHERE id=?`).run(...vals, id);
  return NextResponse.json({ request: getById(id) });
}
