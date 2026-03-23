#!/usr/bin/env bun
/**
 * build.ts — Two-phase build script
 *
 * Phase 1: Bundle the React client into public/dist/
 * Phase 2: Compile the Bun server into a self-contained binary
 *          with all assets embedded via --asset-dir
 */

import { $ } from "bun";
import { mkdir } from "fs/promises";

console.log("╔══════════════════════════════╗");
console.log("║   NexusWrap Build Pipeline   ║");
console.log("╚══════════════════════════════╝\n");

// ── Phase 1: Client bundle ────────────────────────────────────────────────────
console.log("▶ Phase 1 — Building React client…");

await mkdir("public/dist", { recursive: true });

const clientBuild = await Bun.build({
  entrypoints: ["src/client/entry.tsx"],
  outdir: "public/dist",
  minify: true,
  target: "browser",
  naming: "[name].js",
  define: {
    "process.env.NODE_ENV": '"production"',
  },
});

if (!clientBuild.success) {
  console.error("❌ Client build failed:");
  for (const log of clientBuild.logs) console.error(log);
  process.exit(1);
}

console.log(`  ✓ Client bundle written to public/dist/\n`);

// ── Phase 2: Server binary ────────────────────────────────────────────────────
console.log("▶ Phase 2 — Compiling server binary…");

await mkdir("dist", { recursive: true });

await $`bun build src/server/index.ts \
  --compile \
  --outfile dist/fivem-wrapper \
  --asset-dir public`;

console.log("  ✓ Binary written to dist/fivem-wrapper\n");
console.log("✅ Build complete. Run: ./dist/fivem-wrapper");
