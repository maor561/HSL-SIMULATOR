import "server-only";
import { and, asc, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "./db";
import { bookings, cycles, slots } from "./db/schema";

export type SlotWithCount = {
  id: string;
  cycleId: string;
  kind: "briefing" | "sim";
  label: string | null;
  startsAt: Date;
  endsAt: Date;
  capacity: number;
  isOpen: boolean;
  taken: number;
};

export type CycleWithSlots = {
  cycle: typeof cycles.$inferSelect;
  briefings: SlotWithCount[];
  sims: SlotWithCount[];
};

function withCount() {
  return db
    .select({
      id: slots.id,
      cycleId: slots.cycleId,
      kind: slots.kind,
      label: slots.label,
      startsAt: slots.startsAt,
      endsAt: slots.endsAt,
      capacity: slots.capacity,
      isOpen: slots.isOpen,
      taken: sql<number>`(
        select count(*)::int from ${bookings}
        where ${bookings.slotId} = ${slots.id} and ${bookings.status} = 'active'
      )`,
    })
    .from(slots);
}

/** מחזורים שפורסמו, עם החלונות שלהם — לעמוד השיבוץ הציבורי */
export async function getPublishedCycles(): Promise<CycleWithSlots[]> {
  const rows = await db
    .select()
    .from(cycles)
    .where(eq(cycles.isPublished, true))
    .orderBy(asc(cycles.eventDate));

  const result: CycleWithSlots[] = [];
  for (const c of rows) {
    const s = (await withCount()
      .where(eq(slots.cycleId, c.id))
      .orderBy(asc(slots.startsAt))) as SlotWithCount[];
    result.push({
      cycle: c,
      briefings: s.filter((x) => x.kind === "briefing"),
      sims: s.filter((x) => x.kind === "sim"),
    });
  }
  return result;
}

export async function getSlotForBooking(slotId: string) {
  const [row] = (await withCount().where(eq(slots.id, slotId))) as SlotWithCount[];
  if (!row) return null;
  const [cycle] = await db.select().from(cycles).where(eq(cycles.id, row.cycleId));
  return { slot: row, cycle };
}

/** האם לטלפון יש שיבוץ תדריך פעיל במחזור נתון */
export async function hasActiveBriefing(cycleId: string, phone: string): Promise<boolean> {
  const [row] = await db
    .select({ id: bookings.id })
    .from(bookings)
    .where(
      and(
        eq(bookings.cycleId, cycleId),
        eq(bookings.phone, phone),
        eq(bookings.kind, "briefing"),
        eq(bookings.status, "active"),
      ),
    )
    .limit(1);
  return !!row;
}

/** כל השיבוצים הפעילים של עובד לפי טלפון (השם משמש רק לתצוגה) */
export async function getBookingsByPhone(phone: string) {
  return db
    .select({
      id: bookings.id,
      kind: bookings.kind,
      fullName: bookings.fullName,
      status: bookings.status,
      createdAt: bookings.createdAt,
      slotLabel: slots.label,
      startsAt: slots.startsAt,
      endsAt: slots.endsAt,
      cycleName: cycles.name,
      cycleDate: cycles.eventDate,
    })
    .from(bookings)
    .innerJoin(slots, eq(bookings.slotId, slots.id))
    .innerJoin(cycles, eq(bookings.cycleId, cycles.id))
    .where(and(eq(bookings.phone, phone), eq(bookings.status, "active")))
    .orderBy(asc(slots.startsAt));
}

/** תור להקרנה — כל השיבוצים הפעילים מעכשיו והלאה, מקובצים לפי חלון */
export async function getDisplayQueue(fromMsAgo = 30 * 60_000) {
  const from = new Date(Date.now() - fromMsAgo);
  const rows = await db
    .select({
      slotId: slots.id,
      kind: slots.kind,
      label: slots.label,
      startsAt: slots.startsAt,
      endsAt: slots.endsAt,
      capacity: slots.capacity,
      cycleName: cycles.name,
      bookingName: bookings.fullName,
    })
    .from(slots)
    .innerJoin(cycles, eq(slots.cycleId, cycles.id))
    .leftJoin(
      bookings,
      and(eq(bookings.slotId, slots.id), eq(bookings.status, "active")),
    )
    .where(and(eq(cycles.isPublished, true), gte(slots.endsAt, from)))
    .orderBy(asc(slots.startsAt), asc(bookings.createdAt));

  const map = new Map<
    string,
    {
      slotId: string;
      kind: "briefing" | "sim";
      label: string | null;
      startsAt: Date;
      endsAt: Date;
      capacity: number;
      cycleName: string;
      names: string[];
    }
  >();
  for (const r of rows) {
    let g = map.get(r.slotId);
    if (!g) {
      g = {
        slotId: r.slotId,
        kind: r.kind,
        label: r.label,
        startsAt: r.startsAt,
        endsAt: r.endsAt,
        capacity: r.capacity,
        cycleName: r.cycleName,
        names: [],
      };
      map.set(r.slotId, g);
    }
    if (r.bookingName) g.names.push(r.bookingName);
  }
  return [...map.values()];
}

/* ---------- אדמין ---------- */

export async function adminListCycles() {
  const rows = await db.select().from(cycles).orderBy(desc(cycles.eventDate));
  const out = [];
  for (const c of rows) {
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(slots)
      .where(eq(slots.cycleId, c.id));
    const [{ bcount }] = await db
      .select({ bcount: sql<number>`count(*)::int` })
      .from(bookings)
      .where(and(eq(bookings.cycleId, c.id), eq(bookings.status, "active")));
    out.push({ ...c, slotCount: count, bookingCount: bcount });
  }
  return out;
}

export async function adminGetCycle(cycleId: string) {
  const [cycle] = await db.select().from(cycles).where(eq(cycles.id, cycleId));
  if (!cycle) return null;
  const s = (await withCount()
    .where(eq(slots.cycleId, cycleId))
    .orderBy(asc(slots.startsAt))) as SlotWithCount[];
  return { cycle, slots: s };
}

export async function adminGetSlotBookings(slotId: string) {
  return db
    .select()
    .from(bookings)
    .where(eq(bookings.slotId, slotId))
    .orderBy(asc(bookings.createdAt));
}

export async function adminListBookings(cycleId?: string) {
  const where = cycleId
    ? and(eq(bookings.status, "active"), eq(bookings.cycleId, cycleId))
    : eq(bookings.status, "active");
  return db
    .select({
      id: bookings.id,
      kind: bookings.kind,
      fullName: bookings.fullName,
      phoneDisplay: bookings.phoneDisplay,
      createdAt: bookings.createdAt,
      slotLabel: slots.label,
      startsAt: slots.startsAt,
      endsAt: slots.endsAt,
      cycleName: cycles.name,
    })
    .from(bookings)
    .innerJoin(slots, eq(bookings.slotId, slots.id))
    .innerJoin(cycles, eq(bookings.cycleId, cycles.id))
    .where(where)
    .orderBy(asc(slots.startsAt), asc(bookings.createdAt));
}
