import type { Client, VoiceBasedChannel } from "discord.js";
import { appConfig } from "../config";
import { logger } from "../utils/logger";

export async function getMeetingChannel(client: Client<true>): Promise<VoiceBasedChannel> {
  const channel = await client.channels.fetch(appConfig.meetingChannel);
  if (!channel || !channel.isVoiceBased()) {
    throw new Error(
      `Canal de reuniao ${appConfig.meetingChannel} nao encontrado ou nao e um canal de voz`,
    );
  }
  return channel;
}

export async function setConnectAllowed(client: Client<true>, allowed: boolean): Promise<void> {
  const channel = await getMeetingChannel(client);
  await channel.permissionOverwrites.edit(channel.guild.roles.everyone, {
    Connect: allowed,
  });
  logger.info(`Permissao Connect do canal Reuniao definida como ${allowed}`);
}
