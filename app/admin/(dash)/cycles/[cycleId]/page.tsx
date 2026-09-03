import Link from "next/link";
import { notFound } from "next/navigation";
import { adminGetCycle, adminGetSlotBookings } from "@/lib/queries";
import {
  adminCancelBooking,
  deleteCycle,
  deleteSlot,
  setCyclePublished,
  setSlotOpen,
} from "@/lib/actions";
import { AddSlotForm } from "./AddSlotForm";
import { EditCycleForm } from "./EditCycleForm";
import { fmtDate, fmtRange, fmtWeekday } from "@/lib/time";
import type { SlotWithCount } from "@/lib/queries";

export const dynamic = "force-dynamic";

async function SlotBlock({ slot }: { slot: SlotWithCount }) {
  const bookings = await adminGetSlotBookings(slot.id);
  const active = bookings.filter((b) => b.status === "active");
  const pct = Math.round((active.length / slot.capacity) * 100);
  const full = active.length >= slot.capacity;

  return (
    <div className="a-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="font-bold tabular-nums text-slate-900">
            {fmtRange(slot.startsAt, slot.endsAt)}
            {slot.label ? <span className="font-normal text-slate-500"> · {slot.label}</span> : null}
          </div>
          <div className="mt-1 w-44">
            <div className={`fill-bar ${full ? "is-full" : ""}`}>
              <i style={{ width: `${Math.max(pct, 4)}%` }} />
            </div>
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {active.length}/{slot.capacity} משובצים{slot.isOpen ? "" : " · סגור להרשמה"}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <form action={setSlotOpen}>
            <input type="hidden" name="id" value={slot.id} />
            <input type="hidden" name="cycleId" value={slot.cycleId} />
            <input type="hidden" name="open" value={slot.isOpen ? "0" : "1"} />
            <button className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100">
              {slot.isOpen ? "סגור הרשמה" : "פתח הרשמה"}
            </button>
          </form>
          <form action={deleteSlot}>
            <input type="hidden" name="id" value={slot.id} />
            <input type="hidden" name="cycleId" value={slot.cycleId} />
            <button className="rounded-lg border border-rose-200 px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50">
              מחק
            </button>
          </form>
        </div>
      </div>

      {active.length > 0 ? (
        <ul className="mt-3 divide-y divide-slate-100 border-t border-slate-100">
          {active.map((b, i) => (
            <li key={b.id} className="flex items-center justify-between gap-2 py-2 text-sm">
              <span className="flex items-center gap-2">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-500">
                  {i + 1}
                </span>
                <span className="font-medium text-slate-800">{b.fullName}</span>
                <a
                  href={`tel:${b.phoneDisplay}`}
                  dir="ltr"
                  className="text-slate-500 hover:text-brand hover:underline"
                >
                  {b.phoneDisplay}
                </a>
              </span>
              <form action={adminCancelBooking}>
                <input type="hidden" name="id" value={b.id} />
                <button className="text-xs font-semibold text-rose-600 hover:underline">הסר</button>
              </form>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 border-t border-slate-100 pt-3 text-sm text-slate-400">אין שיבוצים.</p>
      )}
    </div>
  );
}

export default async function CyclePage({
  params,
}: {
  params: Promise<{ cycleId: string }>;
}) {
  const { cycleId } = await params;
  const data = await adminGetCycle(cycleId);
  if (!data) notFound();

  const { cycle, slots } = data;
  const briefings = slots.filter((s) => s.kind === "briefing");
  const sims = slots.filter((s) => s.kind === "sim");

  return (
    <div className="space-y-8">
      <div>
        <Link href="/admin" className="text-sm text-slate-500 hover:text-slate-800">
          → כל המחזורים
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">{cycle.name}</h1>
            <div className="text-sm text-slate-500">
              {fmtWeekday(cycle.eventDate + "T12:00:00")} · {fmtDate(cycle.eventDate + "T12:00:00")}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                cycle.isPublished
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {cycle.isPublished ? "● מפורסם" : "טיוטה"}
            </span>
            <form action={setCyclePublished}>
              <input type="hidden" name="id" value={cycle.id} />
              <input type="hidden" name="publish" value={cycle.isPublished ? "0" : "1"} />
              <button
                className={`rounded-lg px-3 py-1.5 text-sm font-bold ${
                  cycle.isPublished
                    ? "border border-slate-300 text-slate-700 hover:bg-slate-100"
                    : "bg-brand text-white hover:brightness-110"
                }`}
              >
                {cycle.isPublished ? "בטל פרסום" : "פרסם מחזור"}
              </button>
            </form>
          </div>
        </div>
      </div>

      <section className="a-card p-4">
        <h2 className="mb-3 text-sm font-bold text-slate-700">פרטי מחזור</h2>
        <EditCycleForm
          id={cycle.id}
          name={cycle.name}
          eventDate={cycle.eventDate}
          notes={cycle.notes ?? ""}
        />
      </section>

      <section className="a-card p-4">
        <h2 className="mb-3 text-sm font-bold text-slate-700">הוספת חלון זמן</h2>
        <AddSlotForm cycleId={cycle.id} defaultDate={cycle.eventDate} />
      </section>

      <section>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-extrabold text-slate-900">
          תדריך והסבר תאורטי
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-500">
            {briefings.length}
          </span>
        </h2>
        {briefings.length === 0 ? (
          <p className="text-sm text-slate-400">אין חלונות תדריך. הוסיפו למעלה (סוג: תדריך).</p>
        ) : (
          <div className="space-y-3">
            {briefings.map((s) => (
              <SlotBlock key={s.id} slot={s} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-extrabold text-slate-900">
          סבב סימולטור
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-500">
            {sims.length}
          </span>
        </h2>
        {sims.length === 0 ? (
          <p className="text-sm text-slate-400">אין חלונות סימולטור. הוסיפו למעלה (סוג: סימולטור).</p>
        ) : (
          <div className="space-y-3">
            {sims.map((s) => (
              <SlotBlock key={s.id} slot={s} />
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
        <h2 className="text-sm font-bold text-rose-800">אזור מסוכן</h2>
        <p className="mt-1 text-sm text-rose-700">
          מחיקת המחזור מוחקת לצמיתות את כל החלונות והשיבוצים שלו.
        </p>
        <form action={deleteCycle} className="mt-3">
          <input type="hidden" name="id" value={cycle.id} />
          <button className="rounded-lg bg-rose-600 px-3 py-1.5 text-sm font-bold text-white hover:bg-rose-700">
            מחיקת מחזור
          </button>
        </form>
      </section>
    </div>
  );
}
