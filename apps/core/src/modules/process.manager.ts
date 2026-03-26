import EventEmitter from "events";
import { loadConfig } from "../common/config";
import { EventNames } from "@fxmanager/shared/constants";
import { type ProcessState, type ServerState } from "@fxmanager/shared/types";

export class ProcessManager extends EventEmitter {
  private state: ServerState = { status: 'stopped', startedAt: null };
	private proc: ReturnType<typeof Bun.spawn> | null = null;

	constructor() {
		super();
	}

	// region process methods
	async start() {
    const config = loadConfig();
    this.setState('starting');

		const args: string[] = [
      '+exec', config.configFile,
      '+set', 'onesync', 'on',
      '+set', 'resource-api-token', config.resourceApiToken,
      '+set', 'api-port', `${config.webServerPort}`,
      // Check if this actually works, would be neat to be able to hide it in console or have it read only
      '+add_convar_permission', 'fxManager', 'read', 'resource-api-token',
      '+add_convar_permission', 'fxManager', 'read', 'api-port',
    ];

		console.log(`[core] Starting fxServer`);

    try {
      this.proc = Bun.spawn([config.executable, ...args], {
        cwd: config.serverDataPath,
        stdin: 'pipe',
        stdout: 'pipe',
        stderr: 'pipe',
        env: { ...process.env },
      });

    	this.setState('running');
			
			return true;
		} catch (err) {
			console.error(`[core] Failed to start fxServer`, err);
			return false;
		}
	}

	async stop() {
		if (this.state.status !== 'running' || !this.proc) 
			throw new Error('server_not_running');

		console.log(`[core] Stopping fxServer`);
    this.setState('stopping');

		this.proc.kill();
    await this.proc.exited;
		this.proc = null;

		console.log(`[core] fxServer has stopped`);
    this.setState('stopped');
	}

  async restart() {
    if (this.state.status === 'running') await this.stop();
    await this.start();
  }

	// region private methods
	private setState(status: ProcessState) {
		const startedAt = status === 'starting'
			? new Date() 
			: status === 'stopped'
				? null 
				: this.state.startedAt;

		const newState = { status, startedAt } satisfies ServerState;

		this.state = newState;
		this.emit(EventNames.SERVERSTATUS, newState);
	}
}
