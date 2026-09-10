import { REST, Routes } from "discord.js";
import { env } from "./config";
import { getCommandsPayload } from "./commands";
import { logger } from "./utils/logger";

async function main(): Promise<void> {
  const commands = getCommandsPayload();
  const rest = new REST().setToken(env.discordToken);

  logger.info(`Registrando ${commands.length} comando(s) no servidor ${env.guildId}...`);

  await rest.put(Routes.applicationGuildCommands(env.clientId, env.guildId), { body: commands });

  logger.info("Comandos registrados com sucesso.");
}

main().catch((error) => {
  logger.error("Falha ao registrar comandos", error as Error);
  process.exit(1);
});
