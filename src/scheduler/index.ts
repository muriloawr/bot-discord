import type { Client } from "discord.js";
import { logger } from "../utils/logger";

export function startScheduler(_client: Client) {
  logger.info("Scheduler started (no jobs registered yet)");
}
