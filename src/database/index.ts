import { DatabaseSync } from "node:sqlite";
import { join } from "node:path";
import { env } from "../config";

export const db = new DatabaseSync(join(env.dataDir, "vanzak-guard.sqlite"));

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL,
    firstSeen TEXT NOT NULL,
    lastSeen TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS violations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId TEXT NOT NULL,
    date TEXT NOT NULL,
    channel TEXT NOT NULL,
    reason TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS actions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    executor TEXT NOT NULL,
    target TEXT NOT NULL,
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS presence_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId TEXT NOT NULL,
    channel TEXT NOT NULL DEFAULT '',
    joinedAt TEXT NOT NULL,
    leftAt TEXT
  );
`);

try {
  db.exec("ALTER TABLE presence_sessions ADD COLUMN channel TEXT NOT NULL DEFAULT ''");
} catch {
  // coluna ja existe (tabela criada antes dessa versao)
}
