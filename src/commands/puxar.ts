import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { logger } from "../utils/logger";
import { logAction } from "../database/actions";

export const data = new SlashCommandBuilder()
  .setName("puxar")
  .setDescription("Move um membro da call dele para a sua")
  .addUserOption((option) =>
    option
      .setName("membro")
      .setDescription("Quem você quer puxar para a sua call")
      .setRequired(true),
  )
  .setDMPermission(false);

export async function execute(interaction: ChatInputCommandInteraction<"cached">): Promise<void> {
  const executor = interaction.member;
  const target = interaction.options.getMember("membro");

  if (!executor.voice.channel) {
    await interaction.reply({
      content: "Você precisa estar em uma call para puxar alguém.",
      ephemeral: true,
    });
    return;
  }

  if (!target) {
    await interaction.reply({
      content: "Não encontrei esse membro no servidor.",
      ephemeral: true,
    });
    return;
  }

  if (!target.voice.channel) {
    await interaction.reply({
      content: `${target.displayName} não está em nenhuma call no momento.`,
      ephemeral: true,
    });
    return;
  }

  if (target.voice.channel.id === executor.voice.channel.id) {
    await interaction.reply({
      content: `${target.displayName} já está na sua call.`,
      ephemeral: true,
    });
    return;
  }

  const destinationChannel = executor.voice.channel;

  try {
    await target.voice.setChannel(destinationChannel, `Puxado por ${executor.user.tag} via /puxar`);
  } catch (error) {
    logger.error(
      `Falha ao puxar ${target.user.tag} para ${destinationChannel.name}`,
      error as Error,
    );
    await interaction.reply({
      content:
        "Não consegui mover esse membro. Verifique se o bot tem permissão de Mover Membros e Conectar nessas calls.",
      ephemeral: true,
    });
    return;
  }

  logAction("PULL_MEMBER", executor.id, target.id);
  logger.info(`${executor.user.tag} puxou ${target.user.tag} para ${destinationChannel.name}`);

  await interaction.reply({
    content: `🔊 ${target.displayName} foi puxado para **${destinationChannel.name}**.`,
  });
}
