import { randomUUID } from "node:crypto";

type DatabaseOperation = "select" | "insert" | "update" | "delete" | "upsert" | "rpc";

function timestamp() {
  return new Date().toISOString();
}

function supabaseProjectHost() {
  const configuredUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!configuredUrl) return undefined;
  try {
    return new URL(configuredUrl).hostname;
  } catch {
    return undefined;
  }
}

export function sanitizeErrorMessage(value: unknown) {
  return typeof value === "string"
    ? value
      .replace(/https?:\/\/\S+/gi, "[url]")
      .replace(/\bBearer\s+\S+/gi, "Bearer [redacted]")
      .replace(/\b(?:sb_secret|sb_publishable|eyJ)[A-Za-z0-9._-]+\b/g, "[redacted]")
      .replace(/\s+/g, " ")
      .slice(0, 240)
    : "Database operation failed";
}

function safeError(error: unknown) {
  if (!error || typeof error !== "object") return { message: "Unknown database error" };
  const item = error as { code?: unknown; message?: unknown };
  const code = typeof item.code === "string" ? item.code.slice(0, 40) : undefined;
  const message = sanitizeErrorMessage(item.message);
  return { ...(code ? { code } : {}), message };
}

function log(event: Record<string, unknown>) {
  if (process.env.NODE_ENV !== "development") return;
  const type = event.type === "database" ? "DB" : String(event.type ?? "app").toUpperCase();
  const label = `${type} ${String(event.event ?? "event").toUpperCase()}`;
  const line = JSON.stringify({ timestamp: timestamp(), ...event });
  if (event.level === "error") console.error(`[${label}]`, line);
  else console.info(`[${label}]`, line);
}

export async function withDatabaseLogging<T>(
  operation: DatabaseOperation,
  table: string,
  execute: () => PromiseLike<T>,
): Promise<T> {
  const requestId = randomUUID();
  const startedAt = Date.now();
  log({
    level: "info",
    type: "database",
    event: "request",
    operation,
    table,
    ...(table === "Products" || table === "Categories" || table === "Sellers"
      ? { projectHost: supabaseProjectHost() }
      : {}),
    requestId,
  });

  try {
    const result = await execute();
    const resultRecord = result && typeof result === "object"
      ? result as { error?: unknown; data?: unknown; rows?: unknown; count?: unknown; rowCount?: unknown; status?: unknown }
      : {};
    const error = resultRecord.error;
    const data = resultRecord.data;
    const rows = Array.isArray(data)
      ? data.length
      : Array.isArray(resultRecord.rows)
        ? resultRecord.rows.length
        : typeof resultRecord.rowCount === "number"
          ? resultRecord.rowCount
          : data == null ? 0 : 1;
    log({
      level: error ? "error" : "info",
      type: "database",
      event: "response",
      operation,
      table,
      ...(table === "Products" || table === "Categories" || table === "Sellers"
        ? { projectHost: supabaseProjectHost() }
        : {}),
      status: error ? "error" : "success",
      ...(typeof resultRecord.status === "number" ? { httpStatus: resultRecord.status } : {}),
      rows,
      ...(typeof resultRecord.count === "number" ? { count: resultRecord.count } : {}),
      durationMs: Date.now() - startedAt,
      requestId,
      ...(error ? { error: safeError(error) } : {}),
    });
    return result;
  } catch (error) {
    log({
      level: "error",
      type: "database",
      event: "response",
      operation,
      table,
      ...(table === "Products" || table === "Categories" || table === "Sellers"
        ? { projectHost: supabaseProjectHost() }
        : {}),
      status: "error",
      durationMs: Date.now() - startedAt,
      requestId,
      error: safeError(error),
    });
    throw error;
  }
}

export async function withApiLogging(
  request: Request,
  operation: string,
  execute: () => Promise<Response>,
) {
  const requestId = randomUUID();
  const startedAt = Date.now();
  log({
    level: "info",
    type: "api",
    event: "request",
    operation,
    method: request.method,
    requestId,
  });
  try {
    const response = await execute();
    log({
      level: response.status >= 500 ? "error" : "info",
      type: "api",
      event: "response",
      operation,
      status: response.status,
      durationMs: Date.now() - startedAt,
      requestId,
    });
    return response;
  } catch (error) {
    log({
      level: "error",
      type: "api",
      event: "response",
      operation,
      status: "error",
      durationMs: Date.now() - startedAt,
      requestId,
      error: safeError(error),
    });
    throw error;
  }
}
