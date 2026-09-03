export const TZ = "Asia/Jerusalem";

/** עטיפה ל-Date.now כדי לא לזהם רכיבי שרת בקריאה "לא טהורה" לפי ה-linter */
export function nowMs(): number {
  return Date.now();
}

export function isPast(d: Date | string): boolean {
  return new Date(d).getTime() < nowMs();
}

export function addMinutes(d: Date, minutes: number): Date {
  return new Date(d.getTime() + minutes * 60_000);
}

export function diffMinutes(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 60_000);
}

/** התאריך של היום בזמן ישראל, בפורמט YYYY-MM-DD */
export function todayInIsrael(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/**
 * "עכשיו" אבל מקובע לתאריך נתון — שעת היום הנוכחית בזמן ישראל, על התאריך שהתקבל.
 * כך פעולות "מצב הפעלה" שומרות את החלונות על תאריך המחזור ולא מזיזות אותם ל-היום.
 */
export function nowOnDate(dateStr: string): Date {
  const p = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const hh = p.find((x) => x.type === "hour")?.value ?? "00";
  const mm = p.find((x) => x.type === "minute")?.value ?? "00";
  return israelLocalToUtc(dateStr, `${hh}:${mm}`);
}

const timeFmt = new Intl.DateTimeFormat("he-IL", {
  timeZone: TZ,
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const dateFmt = new Intl.DateTimeFormat("he-IL", {
  timeZone: TZ,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const weekdayFmt = new Intl.DateTimeFormat("he-IL", {
  timeZone: TZ,
  weekday: "long",
});

export function fmtTime(d: Date | string): string {
  return timeFmt.format(new Date(d));
}

export function fmtDate(d: Date | string): string {
  return dateFmt.format(new Date(d));
}

export function fmtWeekday(d: Date | string): string {
  return weekdayFmt.format(new Date(d));
}

export function fmtRange(a: Date | string, b: Date | string): string {
  return `${fmtTime(a)}–${fmtTime(b)}`;
}

/**
 * הופך קלט של תאריך (YYYY-MM-DD) ושעה (HH:mm) שנחשבים כזמן ישראל
 * ל-Date ב-UTC. מטפל נכון בשעון קיץ/חורף.
 */
export function israelLocalToUtc(dateStr: string, timeStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  const [hh, mm] = timeStr.split(":").map(Number);
  // ניחוש ראשוני ב-UTC
  const guess = Date.UTC(y, m - 1, d, hh, mm);
  // כמה ישראל מוסטת מ-UTC באותו רגע
  const asIsrael = new Date(guess).toLocaleString("en-US", { timeZone: TZ });
  const asUtc = new Date(guess).toLocaleString("en-US", { timeZone: "UTC" });
  const offsetMs = new Date(asUtc).getTime() - new Date(asIsrael).getTime();
  return new Date(guess + offsetMs);
}

/** מפצל Date (UTC) לשדות טופס בזמן ישראל */
export function utcToIsraelFields(d: Date | string): { date: string; time: string } {
  const dt = new Date(d);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(dt);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    time: `${get("hour")}:${get("minute")}`,
  };
}
