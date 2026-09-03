/**
 * זריעת נתוני דמו: מחזור מפורסם אחד עם חלון תדריך וכמה חלונות סימולטור.
 * הרצה:  npm run db:seed
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { db } from "../lib/db";
import { cycles, slots } from "../lib/db/schema";
import { israelLocalToUtc } from "../lib/time";

async function main() {
  const today = new Date();
  const d = new Date(today.getTime() + 2 * 86400_000);
  const dateStr = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jerusalem",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);

  const [cycle] = await db
    .insert(cycles)
    .values({
      name: "מחזור דמו",
      eventDate: dateStr,
      notes: "נתוני בדיקה — אפשר למחוק",
      isPublished: true,
    })
    .returning();

  await db.insert(slots).values({
    cycleId: cycle.id,
    kind: "briefing",
    label: "כיתה 1",
    startsAt: israelLocalToUtc(dateStr, "08:00"),
    endsAt: israelLocalToUtc(dateStr, "09:30"),
    capacity: 10,
  });

  const simStarts = ["09:45", "10:15", "10:45", "11:15", "11:45"];
  for (const t of simStarts) {
    const [h, m] = t.split(":").map(Number);
    const end = `${String(h + (m + 30 >= 60 ? 1 : 0)).padStart(2, "0")}:${String(
      (m + 30) % 60,
    ).padStart(2, "0")}`;
    await db.insert(slots).values({
      cycleId: cycle.id,
      kind: "sim",
      startsAt: israelLocalToUtc(dateStr, t),
      endsAt: israelLocalToUtc(dateStr, end),
      capacity: 2,
    });
  }

  console.log("Seeded cycle:", cycle.id);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
