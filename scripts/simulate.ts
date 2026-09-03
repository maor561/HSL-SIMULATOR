/**
 * סימולציה: ממלא שיבוצים (אנשים) לכל המחזורים במסד.
 * כלל: כל אדם נרשם לתדריך אחד בלבד ולסבב סימולטור אחד בלבד (בכל המערכת).
 * מנקה את כל השיבוצים ואז מייצר חדשים — תדריך מלא כמעט, וזוגות סימולטור
 * מתוך אותו תדריך, עם גיוון: חלונות מלאים / עם אדם אחד / ריקים.
 *
 *   npm run db:simulate
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { db } from "../lib/db";
import { bookings, cycles, slots } from "../lib/db/schema";
import { eq } from "drizzle-orm";

const FIRST = [
  "אבי", "נועה", "יוסי", "דנה", "רון", "מיכל", "איתי", "שירה", "עומר", "טל",
  "גיא", "ליאור", "מור", "עדן", "נטע", "אורי", "יעל", "אסף", "רועי", "הדר",
  "אלון", "מעיין", "בר", "שקד", "עידו", "רותם", "נדב", "איילת", "תום", "ניר",
];
const LAST = [
  "כהן", "לוי", "מזרחי", "פרץ", "ביטון", "אברהם", "פרידמן", "דהן", "אזולאי",
  "גבאי", "שרון", "בר", "אדרי", "חדד", "נחום", "אוחיון", "טל", "רוזן", "שפירא",
];

const rint = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1));
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type Person = { name: string; phone: string; display: string };
const usedPhones = new Set<string>(); // ייחודי בכל המערכת

function makePeople(n: number): Person[] {
  const out: Person[] = [];
  while (out.length < n) {
    const digits = `05${pick(["0", "2", "3", "4", "8"])}${String(rint(1000000, 9999999))}`;
    if (usedPhones.has(digits)) continue;
    usedPhones.add(digits);
    out.push({
      name: `${pick(FIRST)} ${pick(LAST)}`,
      phone: digits,
      display: `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`,
    });
  }
  return out;
}

async function main() {
  const allCycles = await db.select().from(cycles).orderBy(cycles.eventDate);
  if (allCycles.length === 0) {
    console.log("אין מחזורים במסד.");
    process.exit(0);
  }

  for (const c of allCycles) {
    const cSlots = await db
      .select()
      .from(slots)
      .where(eq(slots.cycleId, c.id))
      .orderBy(slots.startsAt);
    if (cSlots.length === 0) {
      console.log(`— ${c.name}: אין חלונות, מדלג`);
      continue;
    }
    await db.delete(bookings).where(eq(bookings.cycleId, c.id));

    const briefings = cSlots.filter((s) => s.kind === "briefing");
    const sims = cSlots.filter((s) => s.kind === "sim");
    const cap = Math.max(...briefings.map((b) => b.capacity), 10);
    const people = makePeople(cap);

    const rows: (typeof bookings.$inferInsert)[] = [];

    // תדריך — ~70%-100% מהקיבולת; כל אדם לתדריך אחד
    const briefedPool: Person[] = [];
    for (const b of briefings) {
      const take = rint(Math.ceil(b.capacity * 0.7), Math.min(b.capacity, people.length));
      for (const p of shuffle(people).slice(0, take)) {
        rows.push({ slotId: b.id, cycleId: c.id, kind: "briefing", fullName: p.name, phone: p.phone, phoneDisplay: p.display });
        briefedPool.push(p);
      }
    }

    // סימולטור — כל אדם לסבב אחד לכל היותר. גיוון: מלא (2) / בודד (1) / ריק (0).
    const queue = shuffle(briefedPool);
    let full = 0,
      solo = 0,
      empty = 0;
    for (const s of sims) {
      const r = Math.random();
      let target = r < 0.55 ? 2 : r < 0.8 ? 1 : 0;
      target = Math.min(target, s.capacity, queue.length);
      for (let i = 0; i < target; i++) {
        const p = queue.shift()!;
        rows.push({ slotId: s.id, cycleId: c.id, kind: "sim", fullName: p.name, phone: p.phone, phoneDisplay: p.display });
      }
      if (target >= 2) full++;
      else if (target === 1) solo++;
      else empty++;
    }

    await db.insert(bookings).values(rows);
    console.log(
      `✓ ${c.name} (${c.eventDate}) — תדריך ${briefedPool.length} · סימולטור ${rows.length - briefedPool.length} ` +
        `(${full} מלאים, ${solo} בודדים, ${empty} ריקים)`,
    );
  }

  console.log("\nסיום. פתחו /admin או /display לראות.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
