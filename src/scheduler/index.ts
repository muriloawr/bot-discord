import cron from "node-cron";
import type { Client } from "discord.js";
import { appConfig } from "../config";
import { logger } from "../utils/logger";
import { openMeetingChannel, sendWarning, closeMeetingChannel } from "../services/meetingService";
import { parseTime, subtractMinutes, toCronExpression } from "../utils/time";

function runSafely(client: Client<true>, label: string, fn: (client: Client<true>) => Promise<void>) {
  return async () => {
    try {
      await fn(client);
    } catch (error) {
      logger.error(`Falha ao executar job "${label}"`, error as Error);
    }
  };
}

export function startScheduler(client: Client<true>): void {
  const { meetingStart, meetingEnd, warningMinutes, timezone } = appConfig;

  const startCron = toCronExpression(parseTime(meetingStart));
  const warningCron = toCronExpression(parseTime(subtractMinutes(meetingEnd, warningMinutes)));
  const endCron = toCronExpression(parseTime(meetingEnd));

  cron.schedule(startCron, runSafely(client, "openMeetingChannel", openMeetingChannel), { timezone });
  cron.schedule(warningCron, runSafely(client, "sendWarning", sendWarning), { timezone });
  cron.schedule(endCron, runSafely(client, "closeMeetingChannel", closeMeetingChannel), { timezone });

  logger.info(
    `Scheduler ativo — abre ${meetingStart}, aviso ${warningMinutes}min antes, fecha ${meetingEnd} (${timezone})`,
  );
}
