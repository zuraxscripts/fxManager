import { broadcast } from "../ws/bus";
import { getDb } from "../db";
import { consoleLogs } from "../db/schema";

export type ServerStatus = "offline" | "starting" | "online" | "stopping";

let proc: ReturnType<typeof Bun.spawn> | null = null;
let _status: ServerStatus = "offline";

export function getStatus(): ServerStatus {
  return _status;
}

function setStatus(s: ServerStatus) {
  _status = s;
  broadcast("server:status", { status: s });
}

async function pipeStream(
  stream: ReadableStream<Uint8Array>,
  source: "stdout" | "stderr"
) {
  const decoder = new TextDecoder();
  const db = getDb();

  for await (const chunk of stream) {
    const text = decoder.decode(chunk);
    const lines = text.split("\n").filter(Boolean);

    for (const line of lines) {
      broadcast("console", { line, source });

      // Persist to DB (fire-and-forget)
      db.insert(consoleLogs)
        .values({ line, source })
        .run();
    }
  }
}

export async function startServer(executablePath: string/* , args: string[] = [] */) {
  if (proc) throw new Error("Server is already running");

  setStatus("starting");

  const args: string[] = [
    '+exec', 'server.cfg',
    '+set', 'onesync', 'on',
    '+set', 'resource-api-token', 'config.resourceApiToken',
    '+set', 'api-port', `${'config.webServerPort'}`,
    // Check if this actually works, would be neat to be able to hide it in console or have it read only
    '+add_convar_permission', 'fxManager', 'read', 'resource-api-token',
    '+add_convar_permission', 'fxManager', 'read', 'api-port',
  ];

  try {
    proc = Bun.spawn([executablePath, ...args], {
      cwd: 'D:/Development/Projects/FiveM/SanAndreasLegacy/txData/server.base',
      stdout: "pipe",
      stderr: "pipe",
      onExit(_, code) {
        proc = null;
        setStatus("offline");
        broadcast("console", {
          line: `[wrapper] Process exited with code ${code}`,
          source: "stdout",
        });
      },
    });

    // Pipe both streams concurrently
    pipeStream(proc.stdout, "stdout");
    pipeStream(proc.stderr, "stderr");

    setStatus("online");
    broadcast("console", {
      line: `[wrapper] Process started (pid ${proc.pid})`,
      source: "stdout",
    });
  } catch (err) {
    setStatus("offline");
    throw err;
  }
}

export async function stopServer() {
  if (!proc) throw new Error("Server is not running");
  setStatus("stopping");
  proc.kill();
}

export function sendCommand(cmd: string) {
  if (!proc?.stdin) throw new Error("No running process");
  proc.stdin.write(cmd + "\n");
}
