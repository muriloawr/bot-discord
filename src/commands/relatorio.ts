import {
  PermissionFlagsBits,
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import { appConfig } from "../config";
import { buildDailyReport } from "../services/reportService";
import { parseBRDate, toDateKey } from "../utils/time";

export const data = new SlashCommandBuilder()
  .setName("relatorio")
  .setDescription("Mostra o tempo em call, intervalo e banheiro de um dia")
  .addStringOption((option) =>
    option
      .setName("data")
      .setDescription("Data no formato dd/mm/aaaa (padrão: hoje)")
      .setRequired(false),
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .setDMPermission(false);

export async function execute(interaction: ChatInputCommandInteraction<"cached">): Promise<void> {
  const rawDate = interaction.options.getString("data");
  const dateKey = rawDate ? parseBRDate(rawDate) : toDateKey(new Date(), appConfig.timezone);

  if (!dateKey) {
    await interaction.reply({
      content: "Data inválida. Use o formato dd/mm/aaaa, ex: 10/09/2026.",
      ephemeral: true,
    });
    return;
  }

  await interaction.reply(buildDailyReport(dateKey));
}
