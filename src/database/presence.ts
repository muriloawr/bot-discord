import { db } from "./index";

export function startPresence(userId: string, channel: string): void {
  db.prepare(
    "INSERT INTO presence_sessions (userId, channel, joinedAt, leftAt) VALUES (?, ?, ?, NULL)",
  ).run(userId, channel, new Date().toISOString());
}

export function endPresence(userId: string, channel: string): void {
  db.prepare(
    "UPDATE presence_sessions SET leftAt = ? WHERE userId = ? AND channel = ? AND leftAt IS NULL",
  ).run(new Date().toISOString(), userId, channel);
}

/**
 * Reconcilia as sessões abertas com quem está de fato conectado agora (chamado
 * no boot do bot). Sessão cujo canal ainda bate com o estado atual fica aberta
 * como estava, preservando o tempo acumulado através de um restart/deploy.
 * Só fecha e reabre sessões de quem saiu ou trocou de canal enquanto o bot
 * estava fora do ar.
 */
export function reconcilePresence(connectedByUser: Map<string, string>): void {
  const now = new Date().toISOString();

  const openSessions = db
    .prepare("SELECT userId, channel FROM presence_sessions WHERE leftAt IS NULL")
    .all() as unknown as { userId: string; channel: string }[];

  const stillOpen = new Set<string>();

  for (const session of openSessions) {
    if (connectedByUser.get(session.userId) === session.channel) {
      stillOpen.add(session.userId);
      continue;
    }

    db.prepare(
      "UPDATE presence_sessions SET leftAt = ? WHERE userId = ? AND channel = ? AND leftAt IS NULL",
    ).run(now, session.userId, session.channel);
  }

  for (const [userId, channel] of connectedByUser) {
    if (!stillOpen.has(userId)) startPresence(userId, channel);
  }
}

export interface PresenceRecord {
  userId: string;
  username: string | null;
  channel: string;
  joinedAt: string;
  leftAt: string | null;
}

export function listPresenceSessions(): PresenceRecord[] {
  return db
    .prepare(
      `SELECT p.userId as userId, u.username as username, p.channel as channel,
              p.joinedAt as joinedAt, p.leftAt as leftAt
       FROM presence_sessions p
       LEFT JOIN users u ON u.id = p.userId
       ORDER BY p.joinedAt ASC`,
    )
    .all() as unknown as PresenceRecord[];
}
