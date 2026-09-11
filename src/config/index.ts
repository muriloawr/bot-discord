import "dotenv/config";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { AppConfig } from "../types";

function loadAppConfig(): AppConfig {
  const raw = readFileSync(join(process.cwd(), "config.json"), "utf-8");
  return JSON.parse(raw) as AppConfig;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  discordToken: requireEnv("DISCORD_TOKEN"),
  guildId: requireEnv("GUILD_ID"),
  clientId: requireEnv("CLIENT_ID"),
  nodeEnv: process.env.NODE_ENV ?? "development",
  logLevel: process.env.LOG_LEVEL ?? "info",
  dataDir: process.env.DATA_DIR ?? process.cwd(),
};

export const appConfig: AppConfig = loadAppConfig();
