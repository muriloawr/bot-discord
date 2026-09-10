import type { Client, SendableChannels } from "discord.js";
import { appConfig } from "../config";
import { listActions, listViolations } from "../database/reports";
import { logger } from "../utils/logger";
import { toDateKey, toDisplayDate, toDisplayTime } from "../utils/time";

const ACTION_LABELS: Record<string, string> = {
  OPEN_CHANNEL: "Call aberta",
  WARNING: "Aviso de encerramento enviado",
  CLOSE_CHANNEL: "Call encerrada",
  DISCONNECT: "Membro desconectado",
};

const MAX_MESSAGE_LENGTH = 1900;

async function getReportChannel(client: Client<true>): Promise<SendableChannels> {
  const channel = await client.channels.fetch(appConfig.reportChannel);
  if (!channel || !channel.isSendable()) {
    throw new Error(
      `Canal de relatorio ${appConfig.reportChannel} nao encontrado ou nao e um canal de texto`,
    );
  }
  return channel;
}

function truncate(content: string): string {
  if (content.length <= MAX_MESSAGE_LENGTH) return content;
  return `${content.slice(0, MAX_MESSAGE_LENGTH)}\n… (relatório truncado, muitos eventos nesse dia)`;
}

export function buildDailyReport(dateKey: string): string {
  const { timezone } = appConfig;

  const violations = listViolations().filter(
    (violation) => toDateKey(new Date(violation.date), timezone) === dateKey,
  );
  const actions = listActions().filter(
    (action) => toDateKey(new Date(action.createdAt), timezone) === dateKey,
  );
  const pulls = actions.filter((action) => action.type === "PULL_MEMBER");
  const systemActions = actions.filter((action) => action.type !== "PULL_MEMBER");

  const lines: string[] = [`📋 **Relatório — ${toDisplayDate(dateKey)}**`, ""];

  if (violations.length === 0) {
    lines.push("🟢 Nenhuma violação registrada.");
  } else {
    lines.push(`🔴 **Violações (${violations.length})**`);
    for (const violation of violations) {
      const name = violation.username ?? violation.userId;
      const time = toDisplayTime(new Date(violation.date), timezone);
      lines.push(`• ${time} — ${name}: ${violation.reason}`);
    }
  }

  lines.push("");

  if (pulls.length === 0) {
    lines.push("🔊 Nenhum /puxar usado.");
  } else {
    lines.push(`🔊 **/puxar usados (${pulls.length})**`);
    for (const pull of pulls) {
      const executorName = pull.executorName ?? pull.executor;
      const targetName = pull.targetName ?? pull.target;
      const time = toDisplayTime(new Date(pull.createdAt), timezone);
      lines.push(`• ${time} — ${executorName} puxou ${targetName}`);
    }
  }

  lines.push("");

  if (systemActions.length === 0) {
    lines.push("⚙️ Nenhum evento de sistema.");
  } else {
    lines.push(`⚙️ **Eventos do sistema (${systemActions.length})**`);
    for (const action of systemActions) {
      const time = toDisplayTime(new Date(action.createdAt), timezone);
      const label = ACTION_LABELS[action.type] ?? action.type;

      if (action.type === "DISCONNECT") {
        const targetName = action.targetName ?? action.target;
        lines.push(`• ${time} — ${label}: ${targetName}`);
      } else {
        lines.push(`• ${time} — ${label}`);
      }
    }
  }

  return truncate(lines.join("\n"));
}

export async function sendDailyReport(client: Client<true>, dateKey?: string): Promise<void> {
  const key = dateKey ?? toDateKey(new Date(), appConfig.timezone);
  const channel = await getReportChannel(client);
  const report = buildDailyReport(key);

  await channel.send(report);
  logger.info(`Relatório diário enviado para o canal ${appConfig.reportChannel} (${key})`);
}
