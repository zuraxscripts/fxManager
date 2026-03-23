import { Hono } from "hono";
import { getConfig, setConfig } from "../db";
import { getDb } from "../db";
import { admins } from "../db/schema";

const setup = new Hono();

setup.get("/status", async (c) => {
  const done = await getConfig("setup_complete");
  return c.json({ configured: !!done });
});

setup.post("/complete", async (c) => {
  const already = await getConfig("setup_complete");
  if (already) return c.json({ error: "Already configured" }, 400);

  const body = await c.req.json<{
    serverName: string;
    serverPath: string;
    adminUsername: string;
    adminPassword: string;
  }>();

  if (!body.adminUsername || !body.adminPassword) {
    return c.json({ error: "Username and password are required" }, 400);
  }
  if (body.adminPassword.length < 8) {
    return c.json({ error: "Password must be at least 8 characters" }, 400);
  }

  const passwordHash = await Bun.password.hash(body.adminPassword);
  const db = getDb();

  await db.insert(admins).values({
    username: body.adminUsername,
    passwordHash,
    role: "superadmin",
  });

  await setConfig("server_name", body.serverName || "My FiveM Server");
  await setConfig("server_path", body.serverPath || "");
  await setConfig("setup_complete", "1");

  return c.json({ ok: true });
});

export default setup;
