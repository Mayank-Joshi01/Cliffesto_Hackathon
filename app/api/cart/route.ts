import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
export async function GET() {
  if (!(await getCurrentUser())) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  return NextResponse.json(
    { error: "Cart reads are unavailable until a verified Supabase user mapping and access policy are configured." },
    { status: 501 },
  );
}
