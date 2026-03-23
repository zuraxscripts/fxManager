# NexusWrap — FiveM/RedM Server Wrapper

A self-contained server wrapper for FiveM/RedM with a web-based admin panel.

## Requirements

- [Bun](https://bun.sh) >= 1.1.0

## Development

```bash
# Install dependencies
bun install

# Start the dev server (hot-reload via bun)
bun run dev
```

Then open http://localhost:3000 — you'll be greeted by the first-run setup wizard.

## Production Build

```bash
# 1. Build the React client bundle
bun run build:client

# 2. Compile server + embedded assets into a single binary
bun run build:server

# Run the binary
./dist/fivem-wrapper
```

The binary is fully self-contained and includes all static assets.

## Project Structure

```
src/
├── server/
│   ├── index.ts              # Bun.serve() entrypoint (HTTP + WS)
│   ├── routes/
│   │   ├── api.ts            # REST API (stats, console, players, audit)
│   │   ├── auth.ts           # Login / logout / session check
│   │   ├── setup.ts          # First-run setup endpoints
│   │   └── shell.ts          # HTML shell renderer (SSR)
│   ├── ws/
│   │   └── bus.ts            # WebSocket pub/sub event bus + console buffer
│   ├── process/
│   │   └── manager.ts        # Bun.spawn() game process + stream piping
│   ├── db/
│   │   ├── index.ts          # DB singleton + config helpers
│   │   ├── schema.ts         # Drizzle ORM schema
│   │   ├── migrate.ts        # Internal migration runner
│   │   └── migrations/
│   │       └── 0001_init.sql # Initial schema migration
│   └── middleware/
│       ├── auth.ts           # Session auth middleware
│       └── setupGuard.ts     # Redirects to /setup before first-run
└── client/
    ├── entry.tsx             # React root mount
    ├── App.tsx               # Route state machine (setup → login → dashboard)
    └── pages/
        ├── SetupPage.tsx     # 3-step first-run wizard
        ├── LoginPage.tsx     # Admin login form
        └── DashboardPage.tsx # Main panel (overview, console, players, audit)
```

## WebSocket Event Topics

| Topic           | Direction     | Payload                             |
|-----------------|---------------|-------------------------------------|
| `console`       | Server → Client | `{ line, source, ts }`            |
| `player:join`   | Server → Client | player snapshot                   |
| `player:leave`  | Server → Client | player snapshot                   |
| `server:status` | Server → Client | `{ status }`                      |
| `audit`         | Server → Client | audit log entry                   |

## Configuration

All config is stored in `data.db` (SQLite) after setup. Key entries:

| Key               | Description                         |
|-------------------|-------------------------------------|
| `setup_complete`  | Set to `"1"` after setup wizard     |
| `server_name`     | Display name for the server         |
| `server_path`     | Path to FXServer executable         |

## Environment Variables

| Variable | Default | Description          |
|----------|---------|----------------------|
| `PORT`   | `3000`  | HTTP server port     |
