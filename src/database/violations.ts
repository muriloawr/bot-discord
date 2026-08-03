import { db } from "./index";

export function logViolation(userId: string, channel: string, reason: string): void {
  db.prepare(
    "INSERT INTO violations (userId, date, channel, reason) VALUES (?, ?, ?, ?)",
  ).run(userId, new Date().toISOString(), channel, reason);
}
