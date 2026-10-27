import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { listAll } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isAdmin()) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  return NextResponse.json({ requests: listAll() });
}
