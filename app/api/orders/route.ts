import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
export async function GET() {
  if (!(await getCurrentUser())) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  return NextResponse.json(
    { error: "Order history is unavailable because the existing database schema has no visible orders table." },
    { status: 501 },
  );
}
