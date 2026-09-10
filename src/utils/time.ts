export interface TimeParts {
  hour: number;
  minute: number;
}

export function parseTime(hhmm: string): TimeParts {
  const [hour, minute] = hhmm.split(":").map(Number);
  return { hour, minute };
}

export function subtractMinutes(hhmm: string, minutesToSubtract: number): string {
  const { hour, minute } = parseTime(hhmm);
  const totalMinutes = (hour * 60 + minute - minutesToSubtract + 24 * 60) % (24 * 60);
  const newHour = Math.floor(totalMinutes / 60);
  const newMinute = totalMinutes % 60;
  return `${String(newHour).padStart(2, "0")}:${String(newMinute).padStart(2, "0")}`;
}

export function toCronExpression({ hour, minute }: TimeParts): string {
  return `${minute} ${hour} * * *`;
}

export function toDateKey(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function toDisplayTime(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function toDisplayDate(dateKey: string): string {
  const [year, month, day] = dateKey.split("-");
  return `${day}/${month}/${year}`;
}

export function parseBRDate(input: string): string | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(input.trim());
  if (!match) return null;

  const [, dayStr, monthStr, yearStr] = match;
  const day = Number(dayStr);
  const month = Number(monthStr);
  const year = Number(yearStr);

  const date = new Date(Date.UTC(year, month - 1, day));
  const isValid =
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;

  return isValid ? `${yearStr}-${monthStr}-${dayStr}` : null;
}
