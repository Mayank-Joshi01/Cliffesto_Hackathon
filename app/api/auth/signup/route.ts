import { NextResponse } from "next/server";
import {
  AuthRateLimitError,
  InvalidAuthOriginError,
  createSession,
  createUser,
  enforceAuthRateLimit,
  requireSameOrigin,
  setSessionCookie,
} from "@/lib/auth";
import { getSignupInputError, isValidSignupInput } from "@/lib/auth-validation";

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body.", code: "INVALID_INPUT" }, { status: 400 });
  }

  if (!isValidSignupInput(payload)) {
    return NextResponse.json({ error: getSignupInputError(payload), code: "INVALID_INPUT" }, { status: 400 });
  }

  try {
    await requireSameOrigin();
    const clientAddress = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    enforceAuthRateLimit(clientAddress);
    const user = await createUser(payload.fullName, payload.email, payload.password);
    await setSessionCookie(await createSession(user.id));
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof AuthRateLimitError) {
      return NextResponse.json({ error: "Too many authentication attempts.", code: "RATE_LIMITED" }, { status: 429 });
    }
    if (error instanceof InvalidAuthOriginError) {
      return NextResponse.json({ error: "Invalid request origin.", code: "INVALID_ORIGIN" }, { status: 403 });
    }
    if (typeof error === "object" && error !== null && "code" in error && error.code === "23505") {
      return NextResponse.json({ error: "Unable to create this account.", code: "DUPLICATE_ACCOUNT" }, { status: 409 });
    }
    console.error("Signup error", error);
    return NextResponse.json({ error: "Authentication service is unavailable.", code: "SERVICE_UNAVAILABLE" }, { status: 503 });
  }
}
