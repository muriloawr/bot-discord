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
  seconds: number;
}

function sortedTotals(totals: Map<string, PresenceTotal>): PresenceTotal[] {
  return [...totals.values()].sort(
    (a, b) => b.seconds - a.seconds || a.name.localeCompare(b.name, "pt-BR"),
  );
}

function addSeconds(totals: Map<string, PresenceTotal>, userId: string, name: string, seconds: number) {
  const entry = totals.get(userId) ?? { name, seconds: 0 };
  entry.seconds += seconds;
  totals.set(userId, entry);
}

function summarizePresence(
  dateKey: string,
  timezone: string,
): { work: PresenceTotal[]; breaks: { label: string; emoji: string; totals: PresenceTotal[] }[] } {
  const breakChannelIds = new Set(appConfig.breakChannels.map((bc) => bc.id));

  const workTotals = new Map<string, PresenceTotal>();
  const breakTotals = new Map<string, Map<string, PresenceTotal>>();
  for (const breakChannel of appConfig.breakChannels) {
    breakTotals.set(breakChannel.id, new Map());
  }

  const sessions = listPresenceSessions().filter(
    (session) => toDateKey(new Date(session.joinedAt), timezone) === dateKey,
  );

  for (const session of sessions) {
    const joinedAt = new Date(session.joinedAt).getTime();
    const leftAt = session.leftAt ? new Date(session.leftAt).getTime() : Date.now();
    const seconds = Math.max(0, Math.round((leftAt - joinedAt) / 1000));
    const name = session.username ?? session.userId;

    if (breakChannelIds.has(session.channel)) {
      addSeconds(breakTotals.get(session.channel)!, session.userId, name, seconds);
    } else {
      addSeconds(workTotals, session.userId, name, seconds);
    }
  }

  return {
    work: sortedTotals(workTotals),
    breaks: appConfig.breakChannels.map((breakChannel) => ({
      label: breakChannel.label,
      emoji: breakChannel.emoji,
      totals: sortedTotals(breakTotals.get(breakChannel.id) ?? new Map()),
    })),
  };
}

function renderPresenceLines(title: string, totals: PresenceTotal[], emptyMessage: string): string[] {
  if (totals.length === 0) return [emptyMessage];

  const lines = [`${title} (${totals.length} pessoa(s))`];
  for (const entry of totals) {
    lines.push(`• ${entry.name}: ${formatDuration(entry.seconds)}`);
  }
  return lines;
}

export function buildDailyReport(dateKey: string): string {
  const { timezone } = appConfig;

  const pulls = listActions()
    .filter((action) => action.type === "PULL_MEMBER")
    .filter((action) => toDateKey(new Date(action.createdAt), timezone) === dateKey);

  const presence = summarizePresence(dateKey, timezone);

  const lines: string[] = [`📋 **Relatório — ${toDisplayDate(dateKey)}**`, ""];

  lines.push(
    ...renderPresenceLines("⏱ **Tempo em call**", presence.work, "⏱ Nenhum tempo de call registrado."),
  );

  for (const breakGroup of presence.breaks) {
    if (breakGroup.totals.length === 0) continue;

    lines.push("");
    lines.push(
      ...renderPresenceLines(`${breakGroup.emoji} **Tempo em ${breakGroup.label}**`, breakGroup.totals, ""),
    );
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
