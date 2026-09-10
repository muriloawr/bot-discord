import { Events, type VoiceState } from "discord.js";
import { logger } from "../utils/logger";
import { touchUser } from "../database/users";
import { startPresence, endPresence } from "../database/presence";

export const name = Events.VoiceStateUpdate;

export function execute(oldState: VoiceState, newState: VoiceState): void {
  const member = newState.member ?? oldState.member;
  if (!member) return;

  touchUser(member.id, member.user.tag);

  if (!oldState.channelId && newState.channelId) {
    startPresence(member.id);
  }

  if (oldState.channelId && !newState.channelId) {
    endPresence(member.id);
  }

  if (newState.channelId && newState.channelId !== oldState.channelId) {
    logger.info(`${member.user.tag} entrou em ${newState.channel?.name}`);
  }

  if (oldState.channelId && oldState.channelId !== newState.channelId) {
    logger.info(`${member.user.tag} saiu de ${oldState.channel?.name}`);
  }
}
