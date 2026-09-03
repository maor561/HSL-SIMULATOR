"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, sql } from "drizzle-orm";
import { db } from "./db";
import { bookings, cycles, slots } from "./db/schema";
import {
  bookingInput,
  cancelInput,
  cycleInput,
  lookupInput,
  quickCycleInput,
  retimeCycleInput,
  retimeSlotInput,
  slotInput,
} from "./validation";
import { hasActiveBriefing } from "./queries";
import {
  checkPassword,
  createSession,
  destroySession,
  requireAdmin,
} from "./auth";
import { addMinutes, diffMinutes, israelLocalToUtc } from "./time";

export type FormState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  /** מזהה שיבוץ שנוצר — לעמוד אישור */
  bookingId?: string;
  /** נתונים לתצוגה חוזרת של הטופס */
  values?: Record<string, string>;
};

/** מאחד את טקסט השגיאה לאורך שרשרת ה-cause (DrizzleQueryError עוטף את שגיאת pg) */
function errBlob(err: unknown): string {
  let cur = err as { code?: string; constraint?: string; message?: string; cause?: unknown } | undefined;
  const parts: string[] = [];
  for (let i = 0; i < 6 && cur; i++) {
    parts.push(cur.code ?? "", cur.constraint ?? "", cur.message ?? "");
    cur = cur.cause as typeof cur;
  }
  return parts.join(" ");
}

function isUniqueViolation(err: unknown): boolean {
  const s = errBlob(err);
  return s.includes("23505") || s.includes("duplicate key");
}

function zodErrors(e: import("zod").ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of e.issues) {
    const key = String(issue.path[0] ?? "_");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

/* ============ ציבורי: שיבוץ ============ */

export async function bookSlot(_prev: FormState, formData: FormData): Promise<FormState> {
  const raw = {
    slotId: String(formData.get("slotId") ?? ""),
    fullName: String(formData.get("fullName") ?? ""),
    phone: String(formData.get("phone") ?? ""),
  };
  const parsed = bookingInput.safeParse(raw);
  if (!parsed.success) {
    return { error: "יש לתקן את הפרטים", fieldErrors: zodErrors(parsed.error), values: raw };
  }
  const { slotId, fullName, phone } = parsed.data;

  const [slot] = await db.select().from(slots).where(eq(slots.id, slotId));
  if (!slot) return { error: "החלון לא נמצא", values: raw };
  if (!slot.isOpen) return { error: "החלון סגור להרשמה", values: raw };
  if (slot.endsAt.getTime() < Date.now())
    return { error: "החלון כבר עבר", values: raw };

  // כל אדם — שיבוץ תדריך אחד ושיבוץ סימולטור אחד בלבד (בכל המערכת)
  const [existingOfKind] = await db
    .select({ id: bookings.id })
    .from(bookings)
    .where(
      and(
        eq(bookings.phone, phone),
        eq(bookings.kind, slot.kind),
        eq(bookings.status, "active"),
      ),
    )
    .limit(1);
  if (existingOfKind) {
    return {
      error:
        slot.kind === "briefing"
          ? "כבר קיים שיבוץ לתדריך עם מספר הטלפון הזה. יש לבטל אותו דרך «השיבוצים שלי» לפני הרשמה מחדש."
          : "כבר קיים שיבוץ לסבב סימולטור עם מספר הטלפון הזה. יש לבטל אותו דרך «השיבוצים שלי» לפני הרשמה מחדש.",
      values: raw,
    };
  }

  // תדריך הוא תנאי מקדים לסימולטור — באותו מחזור
  if (slot.kind === "sim") {
    const ok = await hasActiveBriefing(slot.cycleId, phone);
    if (!ok) {
      return {
        error:
          "כדי להשתבץ לסימולטור צריך קודם שיבוץ פעיל לתדריך באותו מחזור. יש להירשם לתדריך תחילה.",
        values: raw,
      };
    }
  }

  // הכנסה אטומית עם בדיקת קיבולת בשאילתה אחת
  let inserted: { id: string }[] = [];
  try {
    const res = await db.execute<{ id: string }>(sql`
      insert into ${bookings} (slot_id, cycle_id, kind, full_name, phone, phone_display, status)
      select ${slotId}, ${slot.cycleId}, ${slot.kind}, ${fullName}, ${phone}, ${raw.phone.trim()}, 'active'
      where (
        select count(*) from ${bookings}
        where slot_id = ${slotId} and status = 'active'
      ) < ${slot.capacity}
      returning id
    `);
    inserted = Array.isArray(res)
      ? (res as { id: string }[])
      : ((res as { rows?: { id: string }[] }).rows ?? []);
  } catch (err: unknown) {
    if (isUniqueViolation(err)) {
      const s = errBlob(err);
      const msg = s.includes("one_briefing")
        ? "כבר קיים שיבוץ לתדריך עם מספר הטלפון הזה."
        : s.includes("one_sim")
          ? "כבר קיים שיבוץ לסבב סימולטור עם מספר הטלפון הזה."
          : "מספר הטלפון הזה כבר משובץ לחלון הזה.";
      return { error: msg, values: raw };
    }
    throw err;
  }

  if (inserted.length === 0) {
    return { error: "החלון מלא. נסו חלון אחר.", values: raw };
  }

  revalidatePath("/");
  revalidatePath("/my");
  revalidatePath("/display");
  return { ok: true, bookingId: inserted[0].id };
}

/* ============ ציבורי: צפייה וביטול לפי שם + טלפון ============ */

export async function lookupBookings(_prev: FormState, formData: FormData): Promise<FormState> {
  const raw = {
    fullName: String(formData.get("fullName") ?? ""),
    phone: String(formData.get("phone") ?? ""),
  };
  const parsed = lookupInput.safeParse(raw);
  if (!parsed.success) {
    return { error: "יש לתקן את הפרטים", fieldErrors: zodErrors(parsed.error), values: raw };
  }
  // מפנים לעמוד עם הטלפון המנורמל בפרמטר path-less (query) — קריאה בלבד, ללא נתונים רגישים מעבר לטלפון
  redirect(`/my?p=${encodeURIComponent(parsed.data.phone)}`);
}

export async function cancelBooking(_prev: FormState, formData: FormData): Promise<FormState> {
  const raw = {
    bookingId: String(formData.get("bookingId") ?? ""),
    phone: String(formData.get("phone") ?? ""),
  };
  const parsed = cancelInput.safeParse(raw);
  if (!parsed.success) return { error: "בקשה לא תקינה" };

  const [b] = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, parsed.data.bookingId));
  if (!b || b.status !== "active") return { error: "השיבוץ לא נמצא או כבר בוטל" };
  if (b.phone !== parsed.data.phone)
    return { error: "מספר הטלפון לא תואם לשיבוץ" };

  await db
    .update(bookings)
    .set({ status: "cancelled", cancelledAt: new Date() })
    .where(eq(bookings.id, b.id));

  revalidatePath("/");
  revalidatePath("/my");
  revalidatePath("/display");
  return { ok: true };
}

/* ============ אדמין: התחברות ============ */

export async function adminLogin(_prev: FormState, formData: FormData): Promise<FormState> {
  const pw = String(formData.get("password") ?? "");
  if (!pw || !checkPassword(pw)) {
    return { error: "סיסמה שגויה" };
  }
  await createSession();
  redirect("/admin");
}

export async function adminLogout(): Promise<void> {
  await destroySession();
  redirect("/admin/login");
}

/* ============ אדמין: מחזורים ============ */

/**
 * יוצר מחזור עם לוח זמנים דיפולטי: תדריך אחד ואחריו סבבי סימולטור ברצף,
 * כשכל סבב מתחיל בדיוק כשקודמו מסתיים. האדמין צריך רק שם, תאריך ושעת התחלה.
 */
export async function createCycle(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const raw = {
    name: String(formData.get("name") ?? ""),
    eventDate: String(formData.get("eventDate") ?? ""),
    startTime: String(formData.get("startTime") ?? ""),
    briefingMinutes: String(formData.get("briefingMinutes") ?? "45"),
    briefingCapacity: String(formData.get("briefingCapacity") ?? "10"),
    simCount: String(formData.get("simCount") ?? "5"),
    simMinutes: String(formData.get("simMinutes") ?? "45"),
    simCapacity: String(formData.get("simCapacity") ?? "2"),
    notes: String(formData.get("notes") ?? ""),
  };
  const parsed = quickCycleInput.safeParse(raw);
  if (!parsed.success) {
    return { error: "יש לתקן את הפרטים", fieldErrors: zodErrors(parsed.error), values: raw };
  }
  const d = parsed.data;

  const [row] = await db
    .insert(cycles)
    .values({ name: d.name, eventDate: d.eventDate, notes: d.notes || null })
    .returning();

  let cursor = israelLocalToUtc(d.eventDate, d.startTime);
  const rows: (typeof slots.$inferInsert)[] = [];

  const briefEnd = addMinutes(cursor, d.briefingMinutes);
  rows.push({
    cycleId: row.id,
    kind: "briefing",
    startsAt: cursor,
    endsAt: briefEnd,
    capacity: d.briefingCapacity,
  });
  cursor = briefEnd;

  for (let i = 1; i <= d.simCount; i++) {
    const end = addMinutes(cursor, d.simMinutes);
    rows.push({
      cycleId: row.id,
      kind: "sim",
      label: `זוג ${i}`,
      startsAt: cursor,
      endsAt: end,
      capacity: d.simCapacity,
    });
    cursor = end;
  }

  if (rows.length) await db.insert(slots).values(rows);

  revalidatePath("/admin");
  redirect(`/admin/cycles/${row.id}`);
}

/**
 * דוחף את כל לוח הזמנים של מחזור: החלון הראשון מתחיל בשעה החדשה,
 * וכל חלון עוקב מתחיל כשקודמו מסתיים — תוך שמירה על משך כל חלון והסדר.
 */
export async function retimeCycle(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const raw = {
    cycleId: String(formData.get("cycleId") ?? ""),
    eventDate: String(formData.get("eventDate") ?? ""),
    startTime: String(formData.get("startTime") ?? ""),
  };
  const parsed = retimeCycleInput.safeParse(raw);
  if (!parsed.success) {
    return { error: "יש לתקן את הפרטים", fieldErrors: zodErrors(parsed.error), values: raw };
  }
  const { cycleId, eventDate, startTime } = parsed.data;

  const list = await db
    .select()
    .from(slots)
    .where(eq(slots.cycleId, cycleId))
    .orderBy(slots.startsAt);

  let cursor = israelLocalToUtc(eventDate, startTime);
  for (const s of list) {
    const dur = Math.max(5, diffMinutes(s.startsAt, s.endsAt));
    const end = addMinutes(cursor, dur);
    await db.update(slots).set({ startsAt: cursor, endsAt: end }).where(eq(slots.id, s.id));
    cursor = end;
  }
  await db.update(cycles).set({ eventDate }).where(eq(cycles.id, cycleId));

  revalidatePath("/admin");
  revalidatePath(`/admin/cycles/${cycleId}`);
  revalidatePath("/");
  revalidatePath("/display");
  return { ok: true };
}

/** מעדכן חלון בודד (שעת התחלה + משך). אם cascade=1 — דוחף את כל החלונות שאחריו. */
export async function retimeSlot(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const raw = {
    slotId: String(formData.get("slotId") ?? ""),
    cycleId: String(formData.get("cycleId") ?? ""),
    startTime: String(formData.get("startTime") ?? ""),
    minutes: String(formData.get("minutes") ?? ""),
    cascade: String(formData.get("cascade") ?? "1"),
  };
  const parsed = retimeSlotInput.safeParse(raw);
  if (!parsed.success) {
    return { error: "יש לתקן את הפרטים", fieldErrors: zodErrors(parsed.error) };
  }
  const { slotId, cycleId, startTime, minutes, cascade } = parsed.data;

  const [cycle] = await db.select().from(cycles).where(eq(cycles.id, cycleId));
  if (!cycle) return { error: "המחזור לא נמצא" };

  const list = await db
    .select()
    .from(slots)
    .where(eq(slots.cycleId, cycleId))
    .orderBy(slots.startsAt);

  const idx = list.findIndex((s) => s.id === slotId);
  if (idx < 0) return { error: "החלון לא נמצא" };

  let cursor = israelLocalToUtc(cycle.eventDate, startTime);
  const end = addMinutes(cursor, minutes);
  await db.update(slots).set({ startsAt: cursor, endsAt: end }).where(eq(slots.id, slotId));
  cursor = end;

  if (cascade === "1") {
    for (const s of list.slice(idx + 1)) {
      const dur = Math.max(5, diffMinutes(s.startsAt, s.endsAt));
      const e = addMinutes(cursor, dur);
      await db.update(slots).set({ startsAt: cursor, endsAt: e }).where(eq(slots.id, s.id));
      cursor = e;
    }
  }

  revalidatePath("/admin");
  revalidatePath(`/admin/cycles/${cycleId}`);
  revalidatePath("/");
  revalidatePath("/display");
  return { ok: true };
}

export async function updateCycle(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const raw = {
    name: String(formData.get("name") ?? ""),
    eventDate: String(formData.get("eventDate") ?? ""),
    notes: String(formData.get("notes") ?? ""),
  };
  const parsed = cycleInput.safeParse(raw);
  if (!parsed.success) {
    return { error: "יש לתקן את הפרטים", fieldErrors: zodErrors(parsed.error), values: raw };
  }
  await db
    .update(cycles)
    .set({
      name: parsed.data.name,
      eventDate: parsed.data.eventDate,
      notes: parsed.data.notes || null,
    })
    .where(eq(cycles.id, id));
  revalidatePath("/admin");
  revalidatePath(`/admin/cycles/${id}`);
  return { ok: true };
}

export async function setCyclePublished(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const publish = String(formData.get("publish") ?? "") === "1";
  await db.update(cycles).set({ isPublished: publish }).where(eq(cycles.id, id));
  revalidatePath("/admin");
  revalidatePath(`/admin/cycles/${id}`);
  revalidatePath("/");
  revalidatePath("/display");
}

export async function deleteCycle(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  await db.delete(cycles).where(eq(cycles.id, id));
  revalidatePath("/admin");
  revalidatePath("/");
  redirect("/admin");
}

/* ============ אדמין: חלונות ============ */

export async function createSlot(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const raw = {
    cycleId: String(formData.get("cycleId") ?? ""),
    kind: String(formData.get("kind") ?? ""),
    label: String(formData.get("label") ?? ""),
    date: String(formData.get("date") ?? ""),
    startTime: String(formData.get("startTime") ?? ""),
    endTime: String(formData.get("endTime") ?? ""),
    capacity: String(formData.get("capacity") ?? ""),
  };
  const parsed = slotInput.safeParse(raw);
  if (!parsed.success) {
    return { error: "יש לתקן את הפרטים", fieldErrors: zodErrors(parsed.error), values: raw };
  }
  const d = parsed.data;
  await db.insert(slots).values({
    cycleId: d.cycleId,
    kind: d.kind,
    label: d.label || null,
    startsAt: israelLocalToUtc(d.date, d.startTime),
    endsAt: israelLocalToUtc(d.date, d.endTime),
    capacity: d.capacity,
  });
  revalidatePath(`/admin/cycles/${d.cycleId}`);
  revalidatePath("/");
  revalidatePath("/display");
  return { ok: true };
}

export async function setSlotOpen(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const cycleId = String(formData.get("cycleId") ?? "");
  const open = String(formData.get("open") ?? "") === "1";
  await db.update(slots).set({ isOpen: open }).where(eq(slots.id, id));
  revalidatePath(`/admin/cycles/${cycleId}`);
  revalidatePath("/");
}

export async function deleteSlot(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const cycleId = String(formData.get("cycleId") ?? "");
  await db.delete(slots).where(eq(slots.id, id));
  revalidatePath(`/admin/cycles/${cycleId}`);
  revalidatePath("/");
  revalidatePath("/display");
}

/* ============ אדמין: ביטול שיבוץ ============ */

export async function adminCancelBooking(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  await db
    .update(bookings)
    .set({ status: "cancelled", cancelledAt: new Date() })
    .where(and(eq(bookings.id, id), eq(bookings.status, "active")));
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/display");
}

/* ============ אדמין: מצב הפעלה (זמן אמת) ============ */

const GRACE_MS = 60_000;

function revalidateRun(cycleId: string) {
  revalidatePath(`/admin/cycles/${cycleId}/run`);
  revalidatePath(`/admin/cycles/${cycleId}`);
  revalidatePath("/display");
  revalidatePath("/");
  revalidatePath("/my");
}

/** משרשר מחדש את משך החלונות מאינדקס נתון, החל מ-cursor */
async function reflowTail(
  list: (typeof slots.$inferSelect)[],
  fromIndex: number,
  cursor: Date,
) {
  for (const s of list.slice(fromIndex)) {
    const dur = Math.max(5, diffMinutes(s.startsAt, s.endsAt));
    const end = addMinutes(cursor, dur);
    await db.update(slots).set({ startsAt: cursor, endsAt: end }).where(eq(slots.id, s.id));
    cursor = end;
  }
}

/** מסמן שחלון התחיל עכשיו. אם באיחור — דוחף את החלון ואת אלה שאחריו. */
export async function startSlot(formData: FormData): Promise<void> {
  await requireAdmin();
  const slotId = String(formData.get("slotId") ?? "");
  const cycleId = String(formData.get("cycleId") ?? "");
  const now = new Date();

  const list = await db
    .select()
    .from(slots)
    .where(eq(slots.cycleId, cycleId))
    .orderBy(slots.startsAt);
  const idx = list.findIndex((s) => s.id === slotId);
  if (idx < 0) return;

  await db.update(slots).set({ actualStartAt: now, actualEndAt: null }).where(eq(slots.id, slotId));

  // התחלה מאוחרת → דוחפים את הרצף מהחלון הזה
  if (now.getTime() - list[idx].startsAt.getTime() > GRACE_MS) {
    await reflowTail(list, idx, now);
  }
  revalidateRun(cycleId);
}

/** מסמן שחלון הסתיים עכשיו. מיישר את הזמן המתוכנן למציאות ודוחף את הבאים. */
export async function finishSlot(formData: FormData): Promise<void> {
  await requireAdmin();
  const slotId = String(formData.get("slotId") ?? "");
  const cycleId = String(formData.get("cycleId") ?? "");
  const now = new Date();

  const list = await db
    .select()
    .from(slots)
    .where(eq(slots.cycleId, cycleId))
    .orderBy(slots.startsAt);
  const idx = list.findIndex((s) => s.id === slotId);
  if (idx < 0) return;

  const cur = list[idx];
  const startBase = cur.actualStartAt ?? cur.startsAt;
  await db
    .update(slots)
    .set({ actualEndAt: now, startsAt: startBase, endsAt: now })
    .where(eq(slots.id, slotId));

  // אם המציאות שונה מהמתוכנן — דוחפים את החלונות הבאים כך שיתחילו עכשיו
  if (Math.abs(now.getTime() - cur.endsAt.getTime()) > GRACE_MS) {
    await reflowTail(list, idx + 1, now);
  }
  revalidateRun(cycleId);
}

/** מבטל סימון התחלה/סיום של חלון (לא מחזיר זמנים שהוזזו). */
export async function resetSlotRun(formData: FormData): Promise<void> {
  await requireAdmin();
  const slotId = String(formData.get("slotId") ?? "");
  const cycleId = String(formData.get("cycleId") ?? "");
  await db
    .update(slots)
    .set({ actualStartAt: null, actualEndAt: null })
    .where(eq(slots.id, slotId));
  revalidateRun(cycleId);
}

/** דוחף חלון וכל שאחריו ב-N דקות (חיובי=עיכוב, שלילי=הקדמה). */
export async function nudgeFrom(formData: FormData): Promise<void> {
  await requireAdmin();
  const slotId = String(formData.get("slotId") ?? "");
  const cycleId = String(formData.get("cycleId") ?? "");
  const minutes = Number(formData.get("minutes") ?? "0");
  if (!Number.isFinite(minutes) || minutes === 0) return;

  const list = await db
    .select()
    .from(slots)
    .where(eq(slots.cycleId, cycleId))
    .orderBy(slots.startsAt);
  const idx = list.findIndex((s) => s.id === slotId);
  if (idx < 0) return;

  for (const s of list.slice(idx)) {
    await db
      .update(slots)
      .set({ startsAt: addMinutes(s.startsAt, minutes), endsAt: addMinutes(s.endsAt, minutes) })
      .where(eq(slots.id, s.id));
  }
  revalidateRun(cycleId);
}
