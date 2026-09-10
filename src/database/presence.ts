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

export function closeAllOpenPresences(): void {
  db.prepare("UPDATE presence_sessions SET leftAt = ? WHERE leftAt IS NULL").run(
    new Date().toISOString(),
  );
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
