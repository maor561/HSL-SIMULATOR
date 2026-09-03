import "server-only";
import { and, asc, eq, sql, type SQL } from "drizzle-orm";
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
  actualStartAt: Date | null;
  actualEndAt: Date | null;
  taken: number;
};

export type CycleWithSlots = {
  cycle: typeof cycles.$inferSelect;
  briefings: SlotWithCount[];
  sims: SlotWithCount[];
};

/** חלונות עם ספירת שיבוצים פעילים, דרך LEFT JOIN + GROUP BY */
function slotsWithCount(where: SQL | undefined, ordered = true) {
  let q = db
    .select({
      id: slots.id,
      cycleId: slots.cycleId,
      kind: slots.kind,
      label: slots.label,
      startsAt: slots.startsAt,
      endsAt: slots.endsAt,
      capacity: slots.capacity,
      isOpen: slots.isOpen,
      actualStartAt: slots.actualStartAt,
      actualEndAt: slots.actualEndAt,
      taken: sql<number>`count(${bookings.id})::int`,
    })
    .from(slots)
    .leftJoin(bookings, and(eq(bookings.slotId, slots.id), eq(bookings.status, "active")))
    .$dynamic();
  if (where) q = q.where(where);
  q = q.groupBy(slots.id);
  if (ordered) q = q.orderBy(asc(slots.startsAt));
  return q as unknown as Promise<SlotWithCount[]>;
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
    const s = await slotsWithCount(eq(slots.cycleId, c.id));
    result.push({
      cycle: c,
      briefings: s.filter((x) => x.kind === "briefing"),
      sims: s.filter((x) => x.kind === "sim"),
    });
  }
  return result;
}

export async function getSlotForBooking(slotId: string) {
  const [row] = await slotsWithCount(eq(slots.id, slotId), false);
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

export type DisplaySlot = {
  slotId: string;
  kind: "briefing" | "sim";
  label: string | null;
  startsAt: Date;
  endsAt: Date;
  capacity: number;
  actualStartAt: Date | null;
  actualEndAt: Date | null;
  names: string[];
};
export type DisplayCycle = {
  id: string;
  name: string;
  eventDate: string;
  slots: DisplaySlot[];
};

/** להקרנה — כל המחזורים המפורסמים עם החלונות והשמות, מקובצים לניווט במסך */
export async function getDisplayCycles(): Promise<DisplayCycle[]> {
  const rows = await db
    .select({
      cycleId: cycles.id,
      cycleName: cycles.name,
      eventDate: cycles.eventDate,
      slotId: slots.id,
      kind: slots.kind,
      label: slots.label,
      startsAt: slots.startsAt,
      endsAt: slots.endsAt,
      capacity: slots.capacity,
      actualStartAt: slots.actualStartAt,
      actualEndAt: slots.actualEndAt,
      bookingName: bookings.fullName,
    })
    .from(cycles)
    .innerJoin(slots, eq(slots.cycleId, cycles.id))
    .leftJoin(bookings, and(eq(bookings.slotId, slots.id), eq(bookings.status, "active")))
    .where(eq(cycles.isPublished, true))
    .orderBy(asc(cycles.eventDate), asc(slots.startsAt), asc(bookings.createdAt));

  const cyMap = new Map<string, DisplayCycle>();
  const slMap = new Map<string, DisplaySlot>();
  for (const r of rows) {
    let cy = cyMap.get(r.cycleId);
    if (!cy) {
      cy = { id: r.cycleId, name: r.cycleName, eventDate: r.eventDate, slots: [] };
      cyMap.set(r.cycleId, cy);
    }
    let sl = slMap.get(r.slotId);
    if (!sl) {
      sl = {
        slotId: r.slotId,
        kind: r.kind,
        label: r.label,
        startsAt: r.startsAt,
        endsAt: r.endsAt,
        capacity: r.capacity,
        actualStartAt: r.actualStartAt,
        actualEndAt: r.actualEndAt,
        names: [],
      };
      slMap.set(r.slotId, sl);
      cy.slots.push(sl);
    }
    if (r.bookingName) sl.names.push(r.bookingName);
  }
  return [...cyMap.values()];
}

/* ---------- אדמין ---------- */

export async function adminListCycles() {
  const rows = await db
    .select()
    .from(cycles)
    .orderBy(asc(cycles.eventDate), asc(cycles.createdAt));
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
  const s = await slotsWithCount(eq(slots.cycleId, cycleId));
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
