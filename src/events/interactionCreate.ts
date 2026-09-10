import { Events, type Interaction } from "discord.js";
import { logger } from "../utils/logger";

export const name = Events.InteractionCreate;

export async function execute(interaction: Interaction): Promise<void> {
  if (!interaction.isChatInputCommand() || !interaction.inCachedGuild()) return;

  const command = interaction.client.commands.get(interaction.commandName);
  if (!command) {
    logger.error(`Comando desconhecido recebido: ${interaction.commandName}`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    logger.error(`Erro ao executar comando ${interaction.commandName}`, error as Error);

    const errorReply = { content: "Ocorreu um erro ao executar esse comando.", ephemeral: true };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(errorReply);
    } else {
      await interaction.reply(errorReply);
    }
  }
}
