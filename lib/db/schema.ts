import { sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  boolean,
  pgEnum,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

/** סוג חלון זמן: תדריך קבוצתי או סבב סימולטור לזוג */
export const slotKind = pgEnum("slot_kind", ["briefing", "sim"]);

/** מצב שיבוץ */
export const bookingStatus = pgEnum("booking_status", ["active", "cancelled"]);

/**
 * מחזור אימון — יום/סבב שמאגד תחתיו תדריך אחד וכמה חלונות סימולטור.
 * שיבוץ לסימולטור מחייב שיבוץ פעיל לתדריך באותו מחזור.
 */
export const cycles = pgTable("cycles", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  eventDate: text("event_date").notNull(), // YYYY-MM-DD (זמן ישראל)
  notes: text("notes"),
  isPublished: boolean("is_published").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** חלון זמן להשתבצות */
export const slots = pgTable(
  "slots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    cycleId: uuid("cycle_id")
      .notNull()
      .references(() => cycles.id, { onDelete: "cascade" }),
    kind: slotKind("kind").notNull(),
    label: text("label"), // תיאור חופשי, למשל "תרחיש מנוע" / "כיתה 2"
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    capacity: integer("capacity").notNull(), // תדריך: 10, סימולטור: 2
    isOpen: boolean("is_open").notNull().default(true),
    // מצב הפעלה בזמן אמת — נקבע ע"י האדמין במסך ההרצה
    actualStartAt: timestamp("actual_start_at", { withTimezone: true }),
    actualEndAt: timestamp("actual_end_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("slots_cycle_starts_idx").on(t.cycleId, t.startsAt)],
);

/** שיבוץ של עובד לחלון זמן */
export const bookings = pgTable(
  "bookings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slotId: uuid("slot_id")
      .notNull()
      .references(() => slots.id, { onDelete: "cascade" }),
    cycleId: uuid("cycle_id")
      .notNull()
      .references(() => cycles.id, { onDelete: "cascade" }),
    kind: slotKind("kind").notNull(),
    fullName: text("full_name").notNull(),
    phone: text("phone").notNull(), // מנורמל לספרות בלבד
    phoneDisplay: text("phone_display").notNull(), // כפי שהוזן
    status: bookingStatus("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
  },
  (t) => [
    // אותו טלפון לא יכול לתפוס פעמיים אותו חלון פעיל
    uniqueIndex("bookings_slot_phone_active_idx")
      .on(t.slotId, t.phone)
      .where(sql`status = 'active'`),
    // כל אדם — שיבוץ תדריך פעיל אחד בלבד בכל המערכת
    uniqueIndex("bookings_phone_one_briefing_idx")
      .on(t.phone)
      .where(sql`kind = 'briefing' and status = 'active'`),
    // כל אדם — שיבוץ סימולטור פעיל אחד בלבד בכל המערכת
    uniqueIndex("bookings_phone_one_sim_idx")
      .on(t.phone)
      .where(sql`kind = 'sim' and status = 'active'`),
    index("bookings_cycle_phone_idx").on(t.cycleId, t.phone),
    index("bookings_phone_idx").on(t.phone),
  ],
);

export type Cycle = typeof cycles.$inferSelect;
export type Slot = typeof slots.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
