import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { listServices, createService } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ services: await listServices() });
}

export async function POST(request) {
  if (!isAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json();
    const service = await createService(body);
    return NextResponse.json({ service });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
