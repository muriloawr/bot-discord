import type { Client, SendableChannels } from "discord.js";
import { appConfig } from "../config";
import { listActions } from "../database/reports";
import { listPresenceSessions } from "../database/presence";
import { logger } from "../utils/logger";
import { formatDuration, toDateKey, toDisplayDate, toDisplayTime } from "../utils/time";

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

interface PresenceTotal {
  name: string;
  minutes: number;
}

function summarizePresence(dateKey: string, timezone: string): PresenceTotal[] {
  const totals = new Map<string, PresenceTotal>();

  const sessions = listPresenceSessions().filter(
    (session) => toDateKey(new Date(session.joinedAt), timezone) === dateKey,
  );

  for (const session of sessions) {
    const joinedAt = new Date(session.joinedAt).getTime();
    const leftAt = session.leftAt ? new Date(session.leftAt).getTime() : Date.now();
    const minutes = Math.max(0, Math.round((leftAt - joinedAt) / 60000));

    const entry = totals.get(session.userId) ?? {
      name: session.username ?? session.userId,
      minutes: 0,
    };
    entry.minutes += minutes;
    totals.set(session.userId, entry);
  }

  return [...totals.values()].sort((a, b) => b.minutes - a.minutes);
}

export function buildDailyReport(dateKey: string): string {
  const { timezone } = appConfig;

  const pulls = listActions()
    .filter((action) => action.type === "PULL_MEMBER")
    .filter((action) => toDateKey(new Date(action.createdAt), timezone) === dateKey);

  const presenceTotals = summarizePresence(dateKey, timezone);

  const lines: string[] = [`📋 **Relatório — ${toDisplayDate(dateKey)}**`, ""];

  if (presenceTotals.length === 0) {
    lines.push("⏱ Nenhum tempo de call registrado.");
  } else {
    lines.push(`⏱ **Tempo em call (${presenceTotals.length} pessoa(s))**`);
    for (const entry of presenceTotals) {
      lines.push(`• ${entry.name}: ${formatDuration(entry.minutes)}`);
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

  return truncate(lines.join("\n"));
}

export async function sendDailyReport(client: Client<true>, dateKey?: string): Promise<void> {
  const key = dateKey ?? toDateKey(new Date(), appConfig.timezone);
  const channel = await getReportChannel(client);
  const report = buildDailyReport(key);

  await channel.send(report);
  logger.info(`Relatório diário enviado para o canal ${appConfig.reportChannel} (${key})`);
}
