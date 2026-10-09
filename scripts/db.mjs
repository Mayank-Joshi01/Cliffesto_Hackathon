import fs from "node:fs/promises";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const command = process.argv[2];
if (command === "migrate") {
  const migrationsDirectory = new URL("../db/migrations/", import.meta.url);
  const migrations = (await fs.readdir(migrationsDirectory))
    .filter((filename) => filename.endsWith(".sql"))
    .sort();
  await pool.query("CREATE EXTENSION IF NOT EXISTS pgcrypto");
  for (const migration of migrations) {
    const sql = await fs.readFile(new URL(migration, migrationsDirectory), "utf8");
    await pool.query(sql);
  }
} else if (command === "seed") {
  const sql = await fs.readFile(new URL("../db/seed.sql", import.meta.url), "utf8");
  await pool.query(sql);
} else {
  throw new Error("Use migrate or seed.");
}
await pool.end();
