import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { initDb } from "./db";
import { setupGuard } from "./middleware/setupGuard";
import setupRoutes from "./routes/setup";
import authRoutes from "./routes/auth";
import apiRoutes from "./routes/api";
import { renderShell } from "./routes/shell";
import { registerClient, removeClient } from "./ws/bus";
import { getStatus } from "./process/manager";

const PORT = Number(process.env.PORT ?? 3000);

await initDb();

const app = new Hono();

// Static assets
app.use("/dist/*", serveStatic({ root: "./public" }));

// Setup guard — redirects to /setup if not configured
app.use("*", setupGuard);

// API routes
app.route("/api/setup", setupRoutes);
app.route("/api/auth", authRoutes);
app.route("/api", apiRoutes);

// SPA shell — serve React app for all non-API routes
app.get("*", async (c) => {
  const html = renderShell({
    title: "FiveM Wrapper",
    initialData: { status: getStatus() },
  });
  return c.html(html);
});

// Start server with WebSocket support
const server = Bun.serve({
  port: PORT,
  fetch: app.fetch,

  websocket: {
    open(ws) {
      registerClient(ws as any);
      console.log(`[ws] Client connected (total: ${(global as any).__wsCount = ((global as any).__wsCount ?? 0) + 1})`);
    },
    close(ws) {
      removeClient(ws as any);
    },
    message(ws, msg) {
      // Clients can send ping or subscribe messages if needed
    },
  },
});

// Upgrade HTTP → WebSocket for /ws path
const originalFetch = server.fetch;
// Bun.serve({
//   port: PORT,
//   fetch(req, server) {
//     if (new URL(req.url).pathname === "/ws") {
//       const upgraded = server.upgrade(req);
//       if (!upgraded) return new Response("WebSocket upgrade failed", { status: 400 });
//       return undefined as any;
//     }
//     return app.fetch(req, { server });
//   },
//   websocket: {
//     open(ws) {
//       registerClient(ws as any);
//     },
//     close(ws) {
//       removeClient(ws as any);
//     },
//     message() {},
//   },
// });

console.log(`[server] Listening on http://localhost:${PORT}`);
