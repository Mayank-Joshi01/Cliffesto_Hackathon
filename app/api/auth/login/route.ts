import { NextResponse } from "next/server";
import {
  AuthRateLimitError,
  InvalidAuthOriginError,
  createSession,
  enforceAuthRateLimit,
  requireSameOrigin,
  setSessionCookie,
  verifyUser,
} from "@/lib/auth";
import { getLoginInputError, isValidLoginInput } from "@/lib/auth-validation";

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body.", code: "INVALID_INPUT" }, { status: 400 });
  }

  if (!isValidLoginInput(payload)) {
    return NextResponse.json({ error: getLoginInputError(payload), code: "INVALID_INPUT" }, { status: 400 });
  }

  try {
    await requireSameOrigin();
    const clientAddress = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    enforceAuthRateLimit(clientAddress);
    const user = await verifyUser(payload.email, payload.password);
    if (!user) {
      return NextResponse.json({ error: "Incorrect email or password.", code: "INVALID_CREDENTIALS" }, { status: 401 });
    }
    await setSessionCookie(await createSession(user.id));
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof AuthRateLimitError) {
      return NextResponse.json({ error: "Too many authentication attempts.", code: "RATE_LIMITED" }, { status: 429 });
    }
    if (error instanceof InvalidAuthOriginError) {
      return NextResponse.json({ error: "Invalid request origin.", code: "INVALID_ORIGIN" }, { status: 403 });
    }
    console.error("Login error", error);
    return NextResponse.json({ error: "Authentication service is unavailable.", code: "SERVICE_UNAVAILABLE" }, { status: 503 });
  }
}
