import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import {
  clearSessionCookie,
  enforceAuthRateLimit,
  hashPassword,
  verifyPassword,
} from "@/lib/auth";
import { query, withTransaction } from "@/lib/db";
import { authorizeAccountRequest } from "../account-api";

type AccountAddress = {
  id: string;
  full_name: string;
  line1: string;
  city: string;
  postal_code: string;
  country: string;
};

type AddressFields = Omit<AccountAddress, "id">;

async function readBody(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const body: unknown = await request.json();
    return typeof body === "object" && body !== null
      ? (body as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function readAddressFields(body: Record<string, unknown>): AddressFields | null {
  const full_name =
    typeof body.full_name === "string" ? body.full_name.trim() : "";
  const line1 = typeof body.line1 === "string" ? body.line1.trim() : "";
  const city = typeof body.city === "string" ? body.city.trim() : "";
  const postal_code =
    typeof body.postal_code === "string" ? body.postal_code.trim() : "";
  const country =
    typeof body.country === "string" ? body.country.trim() : "";
  const values = { full_name, line1, city, postal_code, country };

  if (
    !values.full_name ||
    values.full_name.length > 100 ||
    !values.line1 ||
    values.line1.length > 250 ||
    !values.city ||
    values.city.length > 100 ||
    !values.postal_code ||
    values.postal_code.length > 20 ||
    !/^[A-Z]{2}$/.test(values.country)
  ) {
    return null;
  }

  return values;
}

export async function POST(request: Request) {
  const account = await authorizeAccountRequest(true);
  if (account instanceof Response) return account;

  const body = await readBody(request);
  if (!body || typeof body.action !== "string") {
    return NextResponse.json({ error: "Invalid account action." }, { status: 400 });
  }

  try {
    switch (body.action) {
      case "update-name": {
        const name = typeof body.name === "string" ? body.name.trim() : "";
        if (!name || name.length > 100) {
          return NextResponse.json(
            { error: "Enter a name between 1 and 100 characters." },
            { status: 400 },
          );
        }

        const updated = await query(
          `UPDATE users
           SET name = $1, full_name = $1, updated_at = now()
           WHERE id = $2 AND is_active = true
           RETURNING id`,
          [name, account.id],
        );
        if (updated.rowCount !== 1) {
          return NextResponse.json({ error: "Account not found." }, { status: 404 });
        }
        return NextResponse.json({ ok: true });
      }

      case "create-address":
      case "update-address": {
        const fields = readAddressFields(body);
        if (!fields) {
          return NextResponse.json(
            { error: "Enter a valid name, address, city, postal code, and two-letter country code." },
            { status: 400 },
          );
        }

        if (body.action === "create-address") {
          const created = await query<AccountAddress>(
            `INSERT INTO addresses
               (user_id, full_name, line1, city, postal_code, country)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id, full_name, line1, city, postal_code, country`,
            [
              account.id,
              fields.full_name,
              fields.line1,
              fields.city,
              fields.postal_code,
              fields.country,
            ],
          );
          return NextResponse.json({ ok: true, address: created.rows[0] });
        }

        if (typeof body.id !== "string") {
          return NextResponse.json({ error: "A valid address is required." }, { status: 400 });
        }
        const updated = await query<AccountAddress>(
          `UPDATE addresses
           SET full_name = $1, line1 = $2, city = $3, postal_code = $4, country = $5
           WHERE id = $6 AND user_id = $7
           RETURNING id, full_name, line1, city, postal_code, country`,
          [
            fields.full_name,
            fields.line1,
            fields.city,
            fields.postal_code,
            fields.country,
            body.id,
            account.id,
          ],
        );
        if (!updated.rows[0]) {
          return NextResponse.json({ error: "Address not found." }, { status: 404 });
        }
        return NextResponse.json({ ok: true, address: updated.rows[0] });
      }

      case "delete-address": {
        if (typeof body.id !== "string") {
          return NextResponse.json({ error: "A valid address is required." }, { status: 400 });
        }
        const deleted = await query(
          `DELETE FROM addresses a
           WHERE a.id = $1
             AND a.user_id = $2
             AND NOT EXISTS (
               SELECT 1 FROM orders o WHERE o.address_id = a.id
             )
           RETURNING a.id`,
          [body.id, account.id],
        );
        if (deleted.rowCount !== 1) {
          const existing = await query<{ id: string }>(
            "SELECT id FROM addresses WHERE id = $1 AND user_id = $2",
            [body.id, account.id],
          );
          if (existing.rows[0]) {
            return NextResponse.json(
              { error: "This address is attached to an order and cannot be deleted." },
              { status: 409 },
            );
          }
          return NextResponse.json({ error: "Address not found." }, { status: 404 });
        }
        return NextResponse.json({ ok: true });
      }

      case "change-password": {
        const currentPassword = body.currentPassword;
        const newPassword = body.newPassword;
        if (
          typeof currentPassword !== "string" ||
          currentPassword.length < 8 ||
          currentPassword.length > 128 ||
          typeof newPassword !== "string" ||
          newPassword.length < 8 ||
          newPassword.length > 128
        ) {
          return NextResponse.json(
            { error: "Passwords must be between 8 and 128 characters." },
            { status: 400 },
          );
        }
        if (currentPassword === newPassword) {
          return NextResponse.json(
            { error: "Choose a password different from your current one." },
            { status: 400 },
          );
        }

        try {
          enforceAuthRateLimit(`account-password:${account.id}`);
        } catch (error) {
          return NextResponse.json(
            {
              error:
                error instanceof Error ? error.message : "Too many attempts.",
            },
            { status: 429 },
          );
        }

        const current = await query<{ password_hash: string }>(
          "SELECT password_hash FROM users WHERE id = $1 AND is_active = true",
          [account.id],
        );
        const currentHash = current.rows[0]?.password_hash;
        if (!currentHash || !(await verifyPassword(currentPassword, currentHash))) {
          return NextResponse.json(
            { error: "Your current password is incorrect." },
            { status: 400 },
          );
        }

        const newHash = await hashPassword(newPassword);
        await withTransaction(async (client) => {
          const updated = await client.query(
            `UPDATE users
             SET password_hash = $1, updated_at = now()
             WHERE id = $2 AND password_hash = $3 AND is_active = true
             RETURNING id`,
            [newHash, account.id, currentHash],
          );
          if (updated.rowCount !== 1) {
            throw new Error("Password changed concurrently.");
          }
          await client.query(
            "UPDATE sessions SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL",
            [account.id],
          );
        });
        await clearSessionCookie();
        return NextResponse.json({ ok: true, signedOut: true });
      }

      case "delete-account": {
        const password = body.password;
        if (
          typeof password !== "string" ||
          password.length < 8 ||
          password.length > 128 ||
          body.confirmation !== "DELETE"
        ) {
          return NextResponse.json(
            { error: "Enter your password and type DELETE to confirm." },
            { status: 400 },
          );
        }

        const current = await query<{ password_hash: string }>(
          "SELECT password_hash FROM users WHERE id = $1 AND is_active = true",
          [account.id],
        );
        const currentHash = current.rows[0]?.password_hash;
        if (!currentHash || !(await verifyPassword(password, currentHash))) {
          return NextResponse.json(
            { error: "Your password is incorrect." },
            { status: 400 },
          );
        }

        const replacementHash = await hashPassword(randomUUID());
        const deletedEmail = `deleted+${randomUUID()}@invalid.example`;
        await withTransaction(async (client) => {
          const deactivated = await client.query(
            `UPDATE users
             SET email = $1, password_hash = $2, name = NULL, full_name = '',
                 is_active = false, updated_at = now()
             WHERE id = $3 AND is_active = true
             RETURNING id`,
            [deletedEmail, replacementHash, account.id],
          );
          if (deactivated.rowCount !== 1) {
            throw new Error("Account was already deactivated.");
          }
          await client.query(
            "UPDATE orders SET address_id = NULL WHERE user_id = $1",
            [account.id],
          );
          await client.query("DELETE FROM addresses WHERE user_id = $1", [
            account.id,
          ]);
          await client.query("DELETE FROM carts WHERE user_id = $1", [
            account.id,
          ]);
          await client.query("DELETE FROM wishlists WHERE user_id = $1", [
            account.id,
          ]);
          await client.query("DELETE FROM sessions WHERE user_id = $1", [
            account.id,
          ]);
        });
        await clearSessionCookie();
        return NextResponse.json({ ok: true });
      }

      default:
        return NextResponse.json(
          { error: "Unsupported account action." },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error(`Account ${body.action} failed`, error);
    return NextResponse.json(
      { error: "Unable to complete your account request right now." },
      { status: 503 },
    );
  }
}
