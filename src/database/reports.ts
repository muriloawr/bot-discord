import { db } from "./index";

export interface ViolationRecord {
  userId: string;
  username: string | null;
  date: string;
  channel: string;
  reason: string;
}

export interface ActionRecord {
  type: string;
  executor: string;
  executorName: string | null;
  target: string;
  targetName: string | null;
  createdAt: string;
}

export function listViolations(): ViolationRecord[] {
  return db
    .prepare(
      `SELECT v.userId as userId, u.username as username, v.date as date, v.channel as channel, v.reason as reason
       FROM violations v
       LEFT JOIN users u ON u.id = v.userId
       ORDER BY v.date ASC`,
    )
    .all() as unknown as ViolationRecord[];
}

export function listActions(): ActionRecord[] {
  return db
    .prepare(
      `SELECT a.type as type, a.executor as executor, eu.username as executorName,
              a.target as target, tu.username as targetName, a.createdAt as createdAt
       FROM actions a
       LEFT JOIN users eu ON eu.id = a.executor
       LEFT JOIN users tu ON tu.id = a.target
       ORDER BY a.createdAt ASC`,
    )
    .all() as unknown as ActionRecord[];
}
