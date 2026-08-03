import { OverwriteType, type Client, type VoiceBasedChannel } from "discord.js";
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

  const roleOverwrites = [...channel.permissionOverwrites.cache.values()].filter(
    (overwrite) => overwrite.type === OverwriteType.Role && overwrite.id !== channel.guild.roles.everyone.id,
  );

  for (const overwrite of roleOverwrites) {
    await channel.permissionOverwrites.edit(overwrite.id, { Connect: allowed });
  }

  logger.info(
    `Permissao Connect do canal Reuniao definida como ${allowed} (@everyone + ${roleOverwrites.length} cargo(s))`,
  );
}
