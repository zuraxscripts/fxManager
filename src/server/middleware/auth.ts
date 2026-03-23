import type { Context, Next } from "hono";
import { getCookie } from "hono/cookie";
import { getDb } from "../db";
import { sessions, admins } from "../db/schema";
import { eq, gt } from "drizzle-orm";

export async function requireAuth(c: Context, next: Next) {
  const token = getCookie(c, "session");
  if (!token) return c.json({ error: "Unauthorized" }, 401);

  const db = getDb();
  const now = new Date();

  const row = await db
    .select({ adminId: sessions.adminId, role: admins.role, username: admins.username })
    .from(sessions)
    .innerJoin(admins, eq(admins.id, sessions.adminId))
    .where(eq(sessions.token, token))
    .get();

  if (!row) return c.json({ error: "Invalid session" }, 401);

  c.set("admin", row);
  await next();
}

export async function requireSuperAdmin(c: Context, next: Next) {
  await requireAuth(c, async () => {});
  const admin = c.get("admin");
  if (admin?.role !== "superadmin") return c.json({ error: "Forbidden" }, 403);
  await next();
}

// Session creation helper
export async function createSession(adminId: number): Promise<string> {
  const db = getDb();
  const token = crypto.randomUUID() + crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // 7 days

  await db.insert(sessions).values({ token, adminId, expiresAt });
  return token;
}
