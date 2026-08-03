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
