import type { Client, SendableChannels } from "discord.js";
import { appConfig } from "../config";
import { isIgnoredMember } from "../middlewares/ignoredRoles";
import { logAction } from "../database/actions";
import { logViolation } from "../database/violations";
import { getMeetingChannel, setConnectAllowed } from "./permissionManager";

async function getAnnounceChannel(client: Client<true>): Promise<SendableChannels> {
  const channel = await client.channels.fetch(appConfig.announceChannel);
  if (!channel || !channel.isSendable()) {
    throw new Error(
      `Canal de avisos ${appConfig.announceChannel} nao encontrado ou nao e um canal de texto`,
    );
  }
  return channel;
}

export async function openMeetingChannel(client: Client<true>): Promise<void> {
  await setConnectAllowed(client, true);

  const announceChannel = await getAnnounceChannel(client);
  await announceChannel.send(`Canal Reunião liberado até às ${appConfig.meetingEnd}.`);

  logAction("OPEN_CHANNEL", "system", appConfig.meetingChannel);
}

export async function sendWarning(client: Client<true>): Promise<void> {
  const announceChannel = await getAnnounceChannel(client);
  await announceChannel.send(`Faltam ${appConfig.warningMinutes} minutos para o encerramento.`);

  logAction("WARNING", "system", appConfig.meetingChannel);
}

export async function closeMeetingChannel(client: Client<true>): Promise<void> {
  await setConnectAllowed(client, false);

  const channel = await getMeetingChannel(client);
  const remainingMembers = [...channel.members.values()];

  for (const member of remainingMembers) {
    if (isIgnoredMember(member)) continue;

    await member.voice.disconnect("Canal Reunião encerrado");
    logAction("DISCONNECT", "system", member.id);
    logViolation(member.id, channel.id, "Permaneceu no canal apos o horario de encerramento");
  }

  const announceChannel = await getAnnounceChannel(client);
  await announceChannel.send("Canal encerrado.\nBom trabalho a todos.");

  logAction("CLOSE_CHANNEL", "system", appConfig.meetingChannel);
}
