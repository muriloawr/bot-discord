import { db } from "./index";

export function logAction(type: string, executor: string, target: string): void {
  db.prepare(
    "INSERT INTO actions (type, executor, target, createdAt) VALUES (?, ?, ?, ?)",
  ).run(type, executor, target, new Date().toISOString());
}
