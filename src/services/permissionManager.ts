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

async function ensureBotAccess(channel: VoiceBasedChannel): Promise<string | undefined> {
  const botRole = channel.guild.members.me?.roles.botRole;
  if (!botRole) return undefined;

  await channel.permissionOverwrites.edit(botRole, {
    ViewChannel: true,
    Connect: true,
    ManageChannels: true,
    MoveMembers: true,
  });

  return botRole.id;
}

export async function setConnectAllowed(client: Client<true>, allowed: boolean): Promise<void> {
  const channel = await getMeetingChannel(client);
  const everyoneId = channel.guild.roles.everyone.id;

  logger.info(`Overwrites ANTES: ${describeOverwrites(channel)}`);

  const botRoleId = await ensureBotAccess(channel);

  await channel.permissionOverwrites.edit(channel.guild.roles.everyone, {
    ViewChannel: true,
    Connect: allowed,
  });

  const roleOverwrites = [...channel.permissionOverwrites.cache.values()].filter(
    (overwrite) =>
      overwrite.type === OverwriteType.Role && overwrite.id !== everyoneId && overwrite.id !== botRoleId,
  );

  for (const overwrite of roleOverwrites) {
    await channel.permissionOverwrites.edit(overwrite.id, {
      ViewChannel: true,
      Connect: allowed,
    });
  }

  logger.info(`Overwrites DEPOIS: ${describeOverwrites(channel)}`);

  logger.info(
    `Permissao Connect do canal Reuniao definida como ${allowed} (@everyone + ${roleOverwrites.length} cargo(s), bot sempre com acesso)`,
  );
}
