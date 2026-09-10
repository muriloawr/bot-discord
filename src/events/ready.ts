import { Client, Events } from "discord.js";
import { logger } from "../utils/logger";
import { startScheduler } from "../scheduler";
import { env } from "../config";
import { closeAllOpenPresences, startPresence } from "../database/presence";

export const name = Events.ClientReady;
export const once = true;

export function execute(client: Client<true>) {
  logger.info(`Logged in as ${client.user.tag}`);

  closeAllOpenPresences();
  const guild = client.guilds.cache.get(env.guildId);
  if (guild) {
    for (const voiceState of guild.voiceStates.cache.values()) {
      if (voiceState.channelId) startPresence(voiceState.id);
    }
  }

  startScheduler(client);
}
