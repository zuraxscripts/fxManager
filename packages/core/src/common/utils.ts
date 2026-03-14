import type { ServerConfig } from '@fxmanager/types';
import { join } from 'node:path';

export const isDev = process.env.NODE_ENV === 'development';

export async function getCoreVersion(): Promise<ServerConfig['version']> {
  if (isDev) {
    const path = join(import.meta.dirname, '..', '..', '..', '..', 'package.json');
    const file = Bun.file(path);

    const pkg = await file.json();
    return pkg.version;
  } else {
    return (process.env.VERSION as ServerConfig['version']) ?? '0.0.0';
  }
}
