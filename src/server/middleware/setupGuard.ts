import type { Context, Next } from "hono";
import { getConfig } from "../db";

export async function setupGuard(c: Context, next: Next) {
  const path = new URL(c.req.url).pathname;

  // Always allow setup routes and static assets
  if (
    path.startsWith("/setup") ||
    path.startsWith("/dist") ||
    path.startsWith("/api/setup")
  ) {
    return next();
  }

  const configured = await getConfig("setup_complete");
  if (!configured) {
    return c.redirect("/setup");
  }

  return next();
}
