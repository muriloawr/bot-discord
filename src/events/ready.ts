import { Client, Events } from "discord.js";
import { logger } from "../utils/logger";
import { startScheduler } from "../scheduler";
import { env } from "../config";
import { reconcilePresence } from "../database/presence";
import { touchUser } from "../database/users";

export const name = Events.ClientReady;
export const once = true;

export function execute(client: Client<true>) {
  logger.info(`Logged in as ${client.user.tag}`);

  const guild = client.guilds.cache.get(env.guildId);
  if (guild) {
    const connectedByUser = new Map<string, string>();
    for (const voiceState of guild.voiceStates.cache.values()) {
      if (!voiceState.channelId || !voiceState.member) continue;
      touchUser(voiceState.member.id, voiceState.member.displayName);
      connectedByUser.set(voiceState.member.id, voiceState.channelId);
    }
    reconcilePresence(connectedByUser);
  }

  startScheduler(client);
}
