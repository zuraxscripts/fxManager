import { Hono } from "hono";
import { setCookie, deleteCookie } from "hono/cookie";
import { getDb } from "../db";
import { admins, sessions } from "../db/schema";
import { eq } from "drizzle-orm";
import { createSession } from "../middleware/auth";

const auth = new Hono();

auth.post("/login", async (c) => {
  const { username, password } = await c.req.json<{
    username: string;
    password: string;
  }>();

  const db = getDb();
  const admin = await db.query.admins.findFirst({
    where: eq(admins.username, username),
  });

  if (!admin) return c.json({ error: "Invalid credentials" }, 401);

  const valid = await Bun.password.verify(password, admin.passwordHash);
  if (!valid) return c.json({ error: "Invalid credentials" }, 401);

  const token = await createSession(admin.id);

  setCookie(c, "session", token, {
    httpOnly: true,
    sameSite: "Lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  return c.json({ ok: true, username: admin.username, role: admin.role });
});

auth.post("/logout", async (c) => {
  const { getCookie } = await import("hono/cookie");
  const token = getCookie(c, "session");
  if (token) {
    const db = getDb();
    await db.delete(sessions).where(eq(sessions.token, token));
  }
  deleteCookie(c, "session");
  return c.json({ ok: true });
});

auth.get("/me", async (c) => {
  const { getCookie } = await import("hono/cookie");
  const token = getCookie(c, "session");
  if (!token) return c.json({ authenticated: false });

  const db = getDb();
  const row = await db
    .select({ id: admins.id, username: admins.username, role: admins.role })
    .from(sessions)
    .innerJoin(admins, eq(admins.id, sessions.adminId))
    .where(eq(sessions.token, token))
    .get();

  if (!row) return c.json({ authenticated: false });
  return c.json({ authenticated: true, ...row });
});

export default auth;
