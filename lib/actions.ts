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
  slotInput,
} from "./validation";
import { hasActiveBriefing } from "./queries";
import {
  checkPassword,
  createSession,
  destroySession,
  requireAdmin,
} from "./auth";
import { israelLocalToUtc } from "./time";

export type FormState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  /** מזהה שיבוץ שנוצר — לעמוד אישור */
  bookingId?: string;
  /** נתונים לתצוגה חוזרת של הטופס */
  values?: Record<string, string>;
};

/** מזהה הפרת אינדקס ייחודי (23505) גם כשהשגיאה עטופה ב-DrizzleQueryError */
function isUniqueViolation(err: unknown): boolean {
  let cur = err as { code?: string; constraint?: string; message?: string; cause?: unknown } | undefined;
  for (let i = 0; i < 6 && cur; i++) {
    if (cur.code === "23505") return true;
    const s = `${cur.constraint ?? ""} ${cur.message ?? ""}`;
    if (s.includes("bookings_slot_phone_active_idx") || s.includes("duplicate key")) return true;
    cur = cur.cause as typeof cur;
  }
  return false;
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
      return { error: "מספר הטלפון הזה כבר משובץ לחלון הזה", values: raw };
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

export async function createCycle(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const raw = {
    name: String(formData.get("name") ?? ""),
    eventDate: String(formData.get("eventDate") ?? ""),
    notes: String(formData.get("notes") ?? ""),
  };
  const parsed = cycleInput.safeParse(raw);
  if (!parsed.success) {
    return { error: "יש לתקן את הפרטים", fieldErrors: zodErrors(parsed.error), values: raw };
  }
  const [row] = await db
    .insert(cycles)
    .values({
      name: parsed.data.name,
      eventDate: parsed.data.eventDate,
      notes: parsed.data.notes || null,
    })
    .returning();
  revalidatePath("/admin");
  redirect(`/admin/cycles/${row.id}`);
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
