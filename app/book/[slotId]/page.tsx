import Link from "next/link";
import { notFound } from "next/navigation";
import { getSlotForBooking } from "@/lib/queries";
import { BookingForm } from "@/components/BookingForm";
import { SiteHeader } from "@/components/SiteHeader";
import { PlaneMark } from "@/components/PlaneMark";
import { fmtDate, fmtRange, fmtWeekday, isPast } from "@/lib/time";

export const dynamic = "force-dynamic";

export default async function BookPage({
  params,
}: {
  params: Promise<{ slotId: string }>;
}) {
  const { slotId } = await params;
  const data = await getSlotForBooking(slotId);
  if (!data || !data.cycle || !data.cycle.isPublished) notFound();

  const { slot, cycle } = data;
  const free = Math.max(0, slot.capacity - slot.taken);
  const past = isPast(slot.endsAt);
  const unavailable = past || !slot.isOpen || free === 0;

  return (
    <div className="min-h-full bg-slate-50">
      <SiteHeader />
      <main className="mx-auto max-w-lg px-4 py-8">
        <Link href="/" className="text-sm text-slate-500 hover:text-slate-800">
          → חזרה לרשימת המחזורים
        </Link>

        <div className="a-card mt-4 overflow-hidden">
          <div className="sky-deep flex items-center gap-3 px-6 py-4 text-white">
            <PlaneMark className="h-9 w-9 text-white/90" />
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-sky-200">
                {slot.kind === "briefing" ? "תדריך והסבר תאורטי" : "סבב סימולטור · A320"}
              </div>
              <h1 className="text-lg font-extrabold">{cycle.name}</h1>
            </div>
          </div>

          <div className="p-6">
          <div className="text-sm text-slate-600">
            {fmtWeekday(cycle.eventDate + "T12:00:00")} · {fmtDate(cycle.eventDate + "T12:00:00")}
            <br />
            {fmtRange(slot.startsAt, slot.endsAt)}
            {slot.label ? ` · ${slot.label}` : ""}
          </div>

          {slot.kind === "sim" ? (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              נדרש שיבוץ פעיל לתדריך של מחזור זה עם אותו מספר טלפון.
            </div>
          ) : null}

          <hr className="my-5 border-slate-200" />

          {unavailable ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-500">
              {past ? "החלון כבר עבר." : free === 0 ? "החלון מלא." : "החלון סגור להרשמה."}
            </div>
          ) : (
            <>
              <p className="mb-4 text-sm text-slate-500">
                נותרו {free} מקומות מתוך {slot.capacity}.
              </p>
              <BookingForm slotId={slot.id} kind={slot.kind} />
            </>
          )}
          </div>
        </div>
      </main>
    </div>
  );
}
