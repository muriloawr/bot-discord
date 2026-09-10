import { db } from "./index";

export function startPresence(userId: string): void {
  db.prepare("INSERT INTO presence_sessions (userId, joinedAt, leftAt) VALUES (?, ?, NULL)").run(
    userId,
    new Date().toISOString(),
  );
}

export function endPresence(userId: string): void {
  db.prepare("UPDATE presence_sessions SET leftAt = ? WHERE userId = ? AND leftAt IS NULL").run(
    new Date().toISOString(),
    userId,
  );
}

export function closeAllOpenPresences(): void {
  db.prepare("UPDATE presence_sessions SET leftAt = ? WHERE leftAt IS NULL").run(
    new Date().toISOString(),
  );
}

export interface PresenceRecord {
  userId: string;
  username: string | null;
  joinedAt: string;
  leftAt: string | null;
}

export function listPresenceSessions(): PresenceRecord[] {
  return db
    .prepare(
      `SELECT p.userId as userId, u.username as username, p.joinedAt as joinedAt, p.leftAt as leftAt
       FROM presence_sessions p
       LEFT JOIN users u ON u.id = p.userId
       ORDER BY p.joinedAt ASC`,
    )
    .all() as unknown as PresenceRecord[];
}
