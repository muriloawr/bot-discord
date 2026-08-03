import { db } from "./index";

export function touchUser(id: string, username: string): void {
  const now = new Date().toISOString();
  const existing = db.prepare("SELECT id FROM users WHERE id = ?").get(id);

  if (existing) {
    db.prepare("UPDATE users SET username = ?, lastSeen = ? WHERE id = ?").run(username, now, id);
  } else {
    db.prepare(
      "INSERT INTO users (id, username, firstSeen, lastSeen) VALUES (?, ?, ?, ?)",
    ).run(id, username, now, now);
  }
}
