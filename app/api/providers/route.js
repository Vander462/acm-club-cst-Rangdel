import { listProviders } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json({ providers: await listProviders() });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
