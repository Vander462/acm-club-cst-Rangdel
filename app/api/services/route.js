import { NextResponse } from "next/server";
import { listServices } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  // Public endpoint - anyone can view services
  return NextResponse.json({ services: await listServices() });
}
