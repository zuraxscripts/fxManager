import type { ServerConfig } from '@fxmanager/types';
import { repo } from '@fxmanager/database';
import { getVersion } from '../common/utils';

const DEFAULTS: ServerConfig = {
  version: await getVersion(),
  executable: process.env.FXSERVER_EXECUTABLE ?? './FXServer',
  serverDataPath: process.env.FXSERVER_DATA_PATH ?? './server-data',
  configFile: process.env.FXSERVER_CFG ?? 'server.cfg',
  autoRestart: true,
  maxRestarts: 5,
  restartDelayMs: 5000,
  webServerPort: process.env.PANEL_PORT ? Number(process.env.PANEL_PORT) : 4000,
  // used for fxserver resource -> process manager communications
  resourceApiToken: crypto.randomUUID(),
};

export function loadConfig(): ServerConfig {
  const stored = repo.settings.get<Partial<ServerConfig>>('server.config');
  return { ...DEFAULTS, ...stored };
}

export function saveConfig(config: Partial<ServerConfig>) {
  repo.settings.set('server.config', config);
}
