import {
  PermissionFlagsBits,
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import { appConfig } from "../config";
import { getMeetingChannel } from "../services/permissionManager";
import { isIgnoredMember } from "../middlewares/ignoredRoles";
import { logAction } from "../database/actions";
import { logger } from "../utils/logger";
import { isWithinAnyWindow } from "../utils/time";

export const data = new SlashCommandBuilder()
  .setName("agregar")
  .setDescription("Reúne todo mundo que já está em alguma call na call Reunião")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .setDMPermission(false);

export async function execute(interaction: ChatInputCommandInteraction<"cached">): Promise<void> {
  const isMeetingTime = isWithinAnyWindow(new Date(), appConfig.meetingWindows, appConfig.timezone);
  if (!isMeetingTime) {
    const windowsText = appConfig.meetingWindows.map((window) => `${window.start}–${window.end}`).join(" ou ");
    await interaction.reply({
      content: `Esse comando só funciona no horário da reunião (${windowsText}).`,
      ephemeral: true,
    });
    return;
  }

  const meetingChannel = await getMeetingChannel(interaction.client);

  let moved = 0;
  for (const voiceState of interaction.guild.voiceStates.cache.values()) {
    if (!voiceState.channelId || voiceState.channelId === meetingChannel.id) continue;

    const member = voiceState.member;
    if (!member || isIgnoredMember(member)) continue;

    try {
      await member.voice.setChannel(
        meetingChannel,
        `Reunião chamada por ${interaction.user.tag} via /agregar`,
      );
      logAction("GATHER", interaction.user.id, member.id);
      moved++;
    } catch (error) {
      logger.error(`Falha ao mover ${member.user.tag} para a Reunião`, error as Error);
    }
  }

  if (moved === 0) {
    await interaction.reply({
      content: "Ninguém pra mover — ou já estão na call, ou não estão em nenhuma call agora.",
      ephemeral: true,
    });
    return;
  }

  await interaction.reply(`📣 ${moved} pessoa(s) movida(s) para **${meetingChannel.name}**.`);
}
