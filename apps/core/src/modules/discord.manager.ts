import { Client, GatewayIntentBits, type Guild } from "discord.js";
import type { DiscordManagerConfig } from "@fxmanager/shared/types";

export class DiscordManager {
  private client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
    ],
  });
  private connectionState: boolean = false;

  private botToken: string;
  private config: Omit<DiscordManagerConfig, 'token'>;

  private guild: Guild | null = null;
  
  constructor ({ token, ...config }: DiscordManagerConfig) {
    this.botToken = token;
    this.config = config;
  }

  async connect() {
    try {
      await this.client.login(this.botToken);
      this.connectionState = true;

      this.client.on('ready', async (client) => {
        this.guild = await client.guilds.fetch(this.config.guildId);
      });
    } catch (err) {
      console.error('[discord.manager] failed to login to discord API.', (err as Error).message)
    }
  }

  async disconnect() {
    try {
      await this.client.destroy();
      this.connectionState = false;
    } catch (err) {
      console.error('[discord.manager] failed to destroy discord client API.', (err as Error).message)
    }
  }

  isConnected() {
    return this.connectionState;
  }

  async checkWhitelist(discordId: string): Promise<boolean> {
    if (!this.guild) {
      throw new Error(`No guild was found for id: ${this.config.guildId}`);
    }

    if (/discord:[0-9]+/.test(discordId)) {
      discordId = discordId.slice(8);
    }

    try {
      const member = await this.guild.members.fetch(discordId);

      if (!member) return false;

      const { roles } = member;

      return roles.cache.hasAny(...this.config.whitelistedRoles);
    } catch {
      return false;
    }
  }
}
