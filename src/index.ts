import { Client, GatewayIntentBits } from "discord.js";
import { env } from "./config";
import { logger } from "./utils/logger";
import { loadEvents } from "./events";
import "./database";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMembers,
  ],
});

loadEvents(client);

client.login(env.discordToken).catch((error) => {
  logger.error("Failed to log in to Discord", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled promise rejection", reason as Error);
});
