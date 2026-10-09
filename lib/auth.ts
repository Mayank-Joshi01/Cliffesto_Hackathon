import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "node:crypto";
import { cookies, headers } from "next/headers";
import { query } from "@/lib/db";
import { getSessionSecret } from "@/lib/env";
import { SESSION_COOKIE } from "@/lib/session-constants";

const SESSION_DAYS = 30;

type UserRow = { id: string; email: string };
type SessionRow = {
  user_id: string;
  name: string;
  email: string;
};



export class AuthRateLimitError extends Error {
  constructor() {
    super("Too many authentication attempts.");
    this.name = "AuthRateLimitError";
  }
}

export class InvalidAuthOriginError extends Error {
  constructor() {
    super("Invalid request origin.");
    this.name = "InvalidAuthOriginError";
  }
}

function tokenHash(token: string) {
  return createHash("sha256").update(`${getSessionSecret()}:${token}`).digest("hex");
}

function passwordDigest(password: string) {
  return createHash("sha256").update("cliffesto-password-v1\0").update(password, "utf8").digest("hex");
}

export async function hashPassword(password: string) {
  return `sha256$${await bcrypt.hash(passwordDigest(password), 12)}`;
}

export async function verifyPassword(password: string, storedHash: string) {
  const versionedHash = storedHash.startsWith("sha256$");
  const hash = versionedHash ? storedHash.slice("sha256$".length) : storedHash;
  const compareValue = versionedHash ? passwordDigest(password) : password;
  return bcrypt.compare(compareValue, hash);
}

export async function createUser(fullName: string, email: string, password: string) {
  const passwordHash = await hashPassword(password);
  const result = await query<UserRow>(
    "INSERT INTO users (full_name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, email",
    [fullName.trim(), email.toLowerCase().trim(), passwordHash],
  );
  return result.rows[0];
}

export async function verifyUser(email: string, password: string) {
  const result = await query<UserRow & { password_hash: string }>(
    "SELECT id, email, password_hash FROM users WHERE email = $1 AND is_active = true",
    [email.toLowerCase().trim()],
  );
  const user = result.rows[0];
  if (!user || !(await verifyPassword(password, user.password_hash))) return null;
  return { id: user.id, email: user.email };
}

export async function createSession(userId: string) {
  const rawToken = randomBytes(32).toString("base64url");
  await query(
    "INSERT INTO sessions (user_id, token_hash, expires_at) VALUES ($1, $2, now() + ($3 * interval '1 day'))",
    [userId, tokenHash(rawToken), SESSION_DAYS],
  );
  return rawToken;
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 });
}



export async function getCurrentUser() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;

  if (!token) return null;

  const result = await query<SessionRow>(
    `SELECT
       s.user_id,
       u.full_name AS name,
       u.email
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = $1
       AND s.revoked_at IS NULL
       AND s.expires_at > now()
       AND u.is_active = true`,
    [tokenHash(token)],
  );

  const row = result.rows[0];

  if (!row) return null;

  return {
    id: row.user_id,
    name: row.name,
    email: row.email,
  };
}




export async function revokeCurrentSession() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (token) await query("UPDATE sessions SET revoked_at = now() WHERE token_hash = $1", [tokenHash(token)]);
  await clearSessionCookie();
}

export async function requireSameOrigin() {
  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin");
  const host = requestHeaders.get("host");
  if (!origin) return;
  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    throw new InvalidAuthOriginError();
  }
  if (!host || originHost !== host) throw new InvalidAuthOriginError();
}

type RateEntry = { count: number; resetAt: number };
const attempts = new Map<string, RateEntry>();
export function enforceAuthRateLimit(key: string) {
  const now = Date.now();
  const current = attempts.get(key);
  if (!current || current.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + 60_000 });
    return;
  }
  current.count += 1;
  if (current.count > 10) throw new AuthRateLimitError();
}
