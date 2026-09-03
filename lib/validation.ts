import { z } from "zod";

/** מנרמל טלפון ישראלי לספרות בלבד, ממיר +972 ל-0 */
export function normalizePhone(raw: string): string {
  let s = raw.replace(/[^\d+]/g, "");
  if (s.startsWith("+972")) s = "0" + s.slice(4);
  else if (s.startsWith("972")) s = "0" + s.slice(3);
  s = s.replace(/\D/g, "");
  return s;
}

const phoneSchema = z
  .string()
  .trim()
  .min(1, "נא להזין מספר טלפון")
  .transform(normalizePhone)
  .refine((v) => /^0\d{8,9}$/.test(v), "מספר טלפון לא תקין (למשל 0501234567)");

const nameSchema = z
  .string()
  .trim()
  .min(2, "נא להזין שם מלא")
  .max(60, "שם ארוך מדי")
  .refine((v) => /\s/.test(v), "נא להזין שם פרטי ומשפחה");

export const bookingInput = z.object({
  slotId: z.string().uuid("חלון לא תקין"),
  fullName: nameSchema,
  phone: phoneSchema,
});

export const lookupInput = z.object({
  fullName: z.string().trim().min(2, "נא להזין שם מלא"),
  phone: phoneSchema,
});

export const cancelInput = z.object({
  bookingId: z.string().uuid(),
  phone: phoneSchema,
});

export const cycleInput = z.object({
  name: z.string().trim().min(2, "נא להזין שם מחזור").max(80),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "תאריך לא תקין"),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

export const slotInput = z
  .object({
    cycleId: z.string().uuid(),
    kind: z.enum(["briefing", "sim"]),
    label: z.string().trim().max(80).optional().or(z.literal("")),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "תאריך לא תקין"),
    startTime: z.string().regex(/^\d{2}:\d{2}$/, "שעה לא תקינה"),
    endTime: z.string().regex(/^\d{2}:\d{2}$/, "שעה לא תקינה"),
    capacity: z.coerce.number().int().min(1).max(50),
  })
  .refine((v) => v.endTime > v.startTime, {
    message: "שעת הסיום חייבת להיות אחרי ההתחלה",
    path: ["endTime"],
  });

export type BookingInput = z.infer<typeof bookingInput>;
