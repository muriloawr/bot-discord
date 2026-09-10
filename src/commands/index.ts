import { readdirSync } from "node:fs";
import { join } from "node:path";
import { Collection, type Client } from "discord.js";
import { logger } from "../utils/logger";
import type { Command } from "../types";

function readCommandModules(): Command[] {
  const files = readdirSync(__dirname).filter(
    (file) => file !== "index.ts" && file !== "index.js" && /\.(ts|js)$/.test(file),
  );

  return files
    .map((file) => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports -- dynamic plugin loading
      return require(join(__dirname, file)) as Partial<Command>;
    })
    .filter((commandModule): commandModule is Command =>
      Boolean(commandModule.data && commandModule.execute),
    );
}

export function loadCommands(client: Client): void {
  client.commands = new Collection();

  for (const command of readCommandModules()) {
    client.commands.set(command.data.name, command);
    logger.info(`Command loaded: ${command.data.name}`);
  }
}

export function getCommandsPayload() {
  return readCommandModules().map((command) => command.data.toJSON());
}
