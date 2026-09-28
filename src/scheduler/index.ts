import cron from "node-cron";
import type { Client } from "discord.js";
import { appConfig } from "../config";
import { logger } from "../utils/logger";
import { sendDailyReport } from "../services/reportService";
import { parseTime, toCronExpression } from "../utils/time";

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
  const { timezone, dailyReportTime } = appConfig;

  cron.schedule(
    toCronExpression(parseTime(dailyReportTime)),
    runSafely("relatorio diario", () => sendDailyReport(client)),
    { timezone },
  );
  logger.info(`Relatório diário agendado para ${dailyReportTime} (${timezone})`);
}
