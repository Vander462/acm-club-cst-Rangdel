import { isAdmin } from "@/lib/auth";
import { listProviders, createProvider } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ providers: await listProviders() });
}

export async function POST(request) {
  if (!isAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json();
    const provider = await createProvider(body);
    return NextResponse.json({ provider });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
