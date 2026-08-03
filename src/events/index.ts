import { readdirSync } from "node:fs";
import { join } from "node:path";
import type { Client } from "discord.js";
import { logger } from "../utils/logger";

export function loadEvents(client: Client) {
  const files = readdirSync(__dirname).filter(
    (file) => file !== "index.ts" && file !== "index.js" && /\.(ts|js)$/.test(file),
  );

  for (const file of files) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- dynamic plugin loading
    const eventModule = require(join(__dirname, file));
    if (!eventModule.name || !eventModule.execute) continue;

    if (eventModule.once) {
      client.once(eventModule.name, eventModule.execute);
    } else {
      client.on(eventModule.name, eventModule.execute);
    }

    logger.info(`Event loaded: ${eventModule.name}`);
  }
}
