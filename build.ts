#!/usr/bin/env bun
/**
 * Build script — produces distributable binaries for Windows and Linux
 * Usage: bun run build.ts [--target windows|linux|all]
 *
 * Output structure:
 *   dist/
 *     fxmanager-linux          ← Linux binary
 *     fxmanager-windows.exe    ← Windows binary
 *     public/                  ← React SPA
 *     resource/                ← FiveM resource
 */

import { $ } from 'bun';
import { existsSync, mkdirSync, cpSync } from 'fs';
import { join } from 'path';

const args = process.argv.slice(2);
const targetArg = args.find((a) => a.startsWith('--target='))?.split('=')[1] ?? 'all';

const DIST = join(import.meta.dir, 'dist');
const ENTRY = join(import.meta.dir, 'packages/core/src/index.ts');
const CLIENT_DIST = join(import.meta.dir, 'packages/panel-ui/dist');

const targets = {
  windows: 'bun-windows-x64',
  linux: 'bun-linux-x64',
} as const;

mkdirSync(DIST, { recursive: true });

console.log('🔨 Building React client...');
await $`bun run --cwd packages/panel-ui build`;
if (!existsSync(CLIENT_DIST)) {
  throw new Error(`Client build failed — dist not found at ${CLIENT_DIST}`);
}

console.log('📦 Compiling binaries...');

const toBuild =
  targetArg === 'all'
    ? Object.entries(targets)
    : [[targetArg, targets[targetArg as keyof typeof targets]]];

for (const [name, target] of toBuild) {
  const ext = name === 'windows' ? '.exe' : '';
  const out = join(DIST, `fxmanager-${name}${ext}`);

  console.log(`  → ${name}: ${out}`);

  await $`bun build --compile --target=${target} --define 'process.env.NODE_ENV="production"' ${ENTRY} --outfile=${out}`;
}

console.log('🌐 Copying client assets → dist/public/');

const publicOut = join(DIST, 'public');
mkdirSync(publicOut, { recursive: true });
cpSync(CLIENT_DIST, publicOut, { recursive: true });

console.log('📁 Copying FiveM resource...');

const resourceOut = join(DIST, 'resource');
mkdirSync(resourceOut, { recursive: true });
cpSync(join(import.meta.dir, 'packages/resource/src'), resourceOut, { recursive: true });

console.log(`
✅ Build complete!

  dist/
  ├── fxmanager-linux          ← Linux binary
  ├── fxmanager-windows.exe    ← Windows binary
  ├── public/                  ← React SPA
  └── resource/                ← Fivem Resource

⚠️  The public/ folder must remain next to the binary when deploying.
`);
