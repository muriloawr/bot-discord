import cron from "node-cron";
import type { Client } from "discord.js";
import { appConfig } from "../config";
import { logger } from "../utils/logger";
import { openMeetingChannel, sendWarning, closeMeetingChannel } from "../services/meetingService";
import { parseTime, subtractMinutes, toCronExpression } from "../utils/time";

function runSafely(label: string, fn: () => Promise<void>) {
  return async () => {
    try {
      await fn();
    } catch (error) {
      logger.error(`Falha ao executar job "${label}"`, error as Error);
    }
  };
}

export function startScheduler(client: Client<true>): void {
  const { meetingWindows, timezone } = appConfig;

  for (const window of meetingWindows) {
    const startCron = toCronExpression(parseTime(window.start));
    const warningCron = toCronExpression(parseTime(subtractMinutes(window.end, window.warningMinutes)));
    const endCron = toCronExpression(parseTime(window.end));

    cron.schedule(
      startCron,
      runSafely(`abrir ${window.start}`, () => openMeetingChannel(client, window)),
      { timezone },
    );
    cron.schedule(
      warningCron,
      runSafely(`aviso ${window.start}`, () => sendWarning(client, window)),
      { timezone },
    );
    cron.schedule(
      endCron,
      runSafely(`fechar ${window.end}`, () => closeMeetingChannel(client, window)),
      { timezone },
    );

    logger.info(
      `Janela registrada: abre ${window.start}, aviso ${window.warningMinutes}min antes, fecha ${window.end} (${timezone})`,
    );
  }
}
