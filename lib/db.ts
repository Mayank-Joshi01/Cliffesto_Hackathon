import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from "pg";
import { getDatabaseUrl } from "@/lib/env";
import { withDatabaseLogging } from "@/lib/observability";

const globalForDb = globalThis as unknown as { pool?: Pool };

export function getPool() {
  if (!globalForDb.pool) {
    globalForDb.pool = new Pool({
      connectionString: getDatabaseUrl(),
      max: Number(process.env.DB_POOL_MAX ?? 10),
      idleTimeoutMillis: 30_000,
    });
  }
  return globalForDb.pool;
}

export async function query<T extends QueryResultRow>(text: string, values: unknown[] = []) {
  const statement = text.trim();
  const operation = /^(INSERT|UPDATE|DELETE|SELECT)\b/i.exec(statement)?.[1]?.toLowerCase();
  const target = /\b(?:FROM|INTO|UPDATE|JOIN)\s+((?:"[^"]+"|[a-z_][\w$]*)(?:\.(?:"[^"]+"|[a-z_][\w$]*))?)/i.exec(statement)?.[1];
  const table = target?.replaceAll('"', "") ?? "unknown";
  const kind = operation === "insert" || operation === "update" || operation === "delete"
    ? operation
    : "select";
  return withDatabaseLogging<QueryResult<T>>(kind, table, () => getPool().query<T>(text, values));
}

export async function withTransaction<T>(callback: (client: PoolClient) => Promise<T>) {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
