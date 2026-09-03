import Link from "next/link";
import { getPublishedCycles, type SlotWithCount } from "@/lib/queries";
import { SiteHeader } from "@/components/SiteHeader";
import { fmtDate, fmtRange, fmtWeekday, isPast } from "@/lib/time";

export const dynamic = "force-dynamic";

function SlotCard({ slot }: { slot: SlotWithCount }) {
  const free = Math.max(0, slot.capacity - slot.taken);
  const full = free === 0;
  const past = isPast(slot.endsAt);
  const disabled = full || past || !slot.isOpen;

  return (
    <li className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4">
      <div className="min-w-0">
        <div className="font-semibold text-slate-900">{fmtRange(slot.startsAt, slot.endsAt)}</div>
        {slot.label ? (
          <div className="truncate text-sm text-slate-500">{slot.label}</div>
        ) : null}
        <div className="mt-1 text-xs text-slate-500">
          {past
            ? "החלון עבר"
            : !slot.isOpen
              ? "סגור להרשמה"
              : full
                ? "מלא"
                : `נותרו ${free} מקומות מתוך ${slot.capacity}`}
        </div>
      </div>
      {disabled ? (
        <span className="shrink-0 rounded-lg bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-400">
          {full ? "מלא" : "לא זמין"}
        </span>
      ) : (
        <Link
          href={`/book/${slot.id}`}
          className="shrink-0 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          שיבוץ
        </Link>
      )}
    </li>
  );
}

export default async function HomePage() {
  const cycles = await getPublishedCycles();

  return (
    <div className="min-h-full">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-2xl font-bold text-slate-900">שיבוץ עצמי לסימולטור</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          כדי להשתבץ לסבב סימולטור צריך קודם להירשם ל<strong>תדריך</strong> של אותו מחזור.
          השיבוץ דורש שם מלא ומספר טלפון בלבד. אפשר לבטל דרך «השיבוצים שלי».
        </p>

        {cycles.length === 0 ? (
          <div className="mt-10 rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
            אין כרגע מחזורים פתוחים לשיבוץ.
          </div>
        ) : (
          <div className="mt-8 space-y-10">
            {cycles.map(({ cycle, briefings, sims }) => (
              <section key={cycle.id}>
                <div className="mb-3">
                  <h2 className="text-lg font-bold text-slate-900">{cycle.name}</h2>
                  <div className="text-sm text-slate-500">
                    {fmtWeekday(cycle.eventDate + "T12:00:00")} · {fmtDate(cycle.eventDate + "T12:00:00")}
                    {cycle.notes ? ` · ${cycle.notes}` : ""}
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500">
                      תדריך והסבר תאורטי
                    </h3>
                    {briefings.length === 0 ? (
                      <p className="text-sm text-slate-400">אין חלונות תדריך.</p>
                    ) : (
                      <ul className="space-y-2">
                        {briefings.map((s) => (
                          <SlotCard key={s.id} slot={s} />
                        ))}
                      </ul>
                    )}
                  </div>

                  <div>
                    <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500">
                      סבב סימולטור (זוג · חצי שעה)
                    </h3>
                    {sims.length === 0 ? (
                      <p className="text-sm text-slate-400">אין חלונות סימולטור.</p>
                    ) : (
                      <ul className="space-y-2">
                        {sims.map((s) => (
                          <SlotCard key={s.id} slot={s} />
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
