/**
 * סימולציה: ממלא שיבוצים (אנשים) לכל המחזורים במסד.
 * מנקה שיבוצים קיימים בכל מחזור ואז מייצר חדשים —
 * תדריך מלא כמעט, וזוגות סימולטור מתוך אותו תדריך (שומר על תנאי המקדים).
 *
 *   npm run db:simulate
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { eq } from "drizzle-orm";
import { db } from "../lib/db";
import { bookings, cycles, slots } from "../lib/db/schema";

const FIRST = [
  "אבי", "נועה", "יוסי", "דנה", "רון", "מיכל", "איתי", "שירה", "עומר", "טל",
  "גיא", "ליאור", "מור", "עדן", "נטע", "אורי", "יעל", "אסף", "רועי", "הדר",
  "אלון", "מעיין", "בר", "שקד", "עידו", "רותם", "נדב", "איילת", "תום", "ניר",
];
const LAST = [
  "כהן", "לוי", "מזרחי", "פרץ", "ביטון", "אברהם", "פרידמן", "דהן", "אזולאי",
  "גבאי", "שרון", "בר", "אדרי", "חדד", "נחום", "אוחיון", "טל", "רוזן", "שפירא",
];

function rint(a: number, b: number) {
  return a + Math.floor(Math.random() * (b - a + 1));
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type Person = { name: string; phone: string; display: string };

function makePeople(n: number): Person[] {
  const seen = new Set<string>();
  const out: Person[] = [];
  while (out.length < n) {
    const name = `${pick(FIRST)} ${pick(LAST)}`;
    const digits = `05${pick(["0", "2", "3", "4", "8"])}${String(rint(1000000, 9999999))}`;
    if (seen.has(digits)) continue;
    seen.add(digits);
    out.push({
      name,
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

    // ניקוי שיבוצים קיימים במחזור
    await db.delete(bookings).where(eq(bookings.cycleId, c.id));

    const briefings = cSlots.filter((s) => s.kind === "briefing");
    const sims = cSlots.filter((s) => s.kind === "sim");

    // מאגר אנשים למחזור — מספיק לתדריכים
    const poolSize = Math.max(...briefings.map((b) => b.capacity), 10);
    const pool = makePeople(poolSize + 4);

    const rows: (typeof bookings.$inferInsert)[] = [];
    const briefedPhones = new Set<string>();

    // תדריך: ממלא ~70%-100% מהקיבולת
    for (const b of briefings) {
      const take = rint(Math.ceil(b.capacity * 0.7), b.capacity);
      for (const p of shuffle(pool).slice(0, take)) {
        rows.push({
          slotId: b.id,
          cycleId: c.id,
          kind: "briefing",
          fullName: p.name,
          phone: p.phone,
          phoneDisplay: p.display,
        });
        briefedPhones.add(p.phone);
      }
    }

    const briefed = pool.filter((p) => briefedPhones.has(p.phone));

    // סימולטור: זוגות מתוך מי שהיה בתדריך, עם גיוון מכוון —
    // רוב החלונות מלאים (2), חלק עם אדם אחד (1), חלק ריקים (0).
    const targetFor = () => {
      const r = Math.random();
      if (r < 0.55) return 2; // זוג מלא
      if (r < 0.8) return 1; // אדם בודד
      return 0; // חלון ריק
    };
    for (const s of sims) {
      const target = Math.min(targetFor(), s.capacity);
      for (const p of shuffle(briefed).slice(0, target)) {
        rows.push({
          slotId: s.id,
          cycleId: c.id,
          kind: "sim",
          fullName: p.name,
          phone: p.phone,
          phoneDisplay: p.display,
        });
      }
    }

    if (rows.length) await db.insert(bookings).values(rows);
    const simRows = rows.filter((r) => r.kind === "sim").length;
    const simFull = sims.filter((s) => rows.filter((r) => r.slotId === s.id).length >= 2).length;
    const simSolo = sims.filter((s) => rows.filter((r) => r.slotId === s.id).length === 1).length;
    const simEmpty = sims.length - simFull - simSolo;
    console.log(
      `✓ ${c.name} (${c.eventDate}) — תדריך ${briefedPhones.size} · סימולטור ${simRows} ` +
        `(${simFull} מלאים, ${simSolo} בודדים, ${simEmpty} ריקים)`,
    );
  }

  console.log("\nסיום. פתחו /admin או /display לראות.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
