import { OverwriteType, type Client, type VoiceBasedChannel } from "discord.js";
import { appConfig } from "../config";
import { logger } from "../utils/logger";

export async function getMeetingChannel(client: Client<true>): Promise<VoiceBasedChannel> {
  const channel = await client.channels.fetch(appConfig.meetingChannel, { force: true });
  if (!channel || !channel.isVoiceBased()) {
    throw new Error(
      `Canal de reuniao ${appConfig.meetingChannel} nao encontrado ou nao e um canal de voz`,
    );
  }
  return channel;
}

function describeOverwrites(channel: VoiceBasedChannel): string {
  return [...channel.permissionOverwrites.cache.values()]
    .map((overwrite) => {
      const label =
        overwrite.type === OverwriteType.Role
          ? (channel.guild.roles.cache.get(overwrite.id)?.name ?? overwrite.id)
          : `member:${overwrite.id}`;
      return `[${label} allow=${overwrite.allow.toArray().join(",") || "-"} deny=${overwrite.deny.toArray().join(",") || "-"}]`;
    })
    .join(" ");
}

export async function setConnectAllowed(client: Client<true>, allowed: boolean): Promise<void> {
  const channel = await getMeetingChannel(client);
  const everyoneId = channel.guild.roles.everyone.id;

  logger.info(`Overwrites ANTES: ${describeOverwrites(channel)}`);

  await channel.permissionOverwrites.edit(channel.guild.roles.everyone, {
    ViewChannel: true,
    Connect: allowed,
  });

  const roleOverwrites = [...channel.permissionOverwrites.cache.values()].filter(
    (overwrite) => overwrite.type === OverwriteType.Role && overwrite.id !== everyoneId,
  );

  for (const overwrite of roleOverwrites) {
    await channel.permissionOverwrites.edit(overwrite.id, {
      ViewChannel: true,
      Connect: allowed,
    });
  }

  const refreshed = await getMeetingChannel(client);
  logger.info(`Overwrites DEPOIS: ${describeOverwrites(refreshed)}`);

  logger.info(
    `Permissao Connect do canal Reuniao definida como ${allowed} (@everyone + ${roleOverwrites.length} cargo(s), ViewChannel sempre liberado)`,
  );
}
