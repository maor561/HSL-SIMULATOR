import Link from "next/link";
import { getPublishedCycles, type SlotWithCount } from "@/lib/queries";
import { SiteHeader } from "@/components/SiteHeader";
import { PlaneMark } from "@/components/PlaneMark";
import { fmtDate, fmtRange, fmtWeekday, isPast } from "@/lib/time";

export const dynamic = "force-dynamic";

function KindIcon({ kind, className = "" }: { kind: "briefing" | "sim"; className?: string }) {
  if (kind === "briefing") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.8}>
        <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H18a2 2 0 0 1 2 2v13a1 1 0 0 1-1 1H6a2 2 0 0 1-2-2V5.5Z" />
        <path d="M8 4v14M4 17.5A1.5 1.5 0 0 1 5.5 16H20" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path d="M12 4c1.2 0 2 1.6 2 4v2l6 3.5v2L14 17v2c0 1.6-.6 3-2 3s-2-1.4-2-3v-2l-6-1.5v-2L10 10V8c0-2.4.8-4 2-4Z" />
    </svg>
  );
}

function SlotCard({ slot }: { slot: SlotWithCount }) {
  const free = Math.max(0, slot.capacity - slot.taken);
  const full = free === 0;
  const past = isPast(slot.endsAt);
  const disabled = full || past || !slot.isOpen;
  const pct = Math.round((slot.taken / slot.capacity) * 100);

  return (
    <li className={`a-card ${disabled ? "" : "a-card-hover"} p-4`}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="font-bold tabular-nums text-slate-900">
            {fmtRange(slot.startsAt, slot.endsAt)}
          </div>
          {slot.label ? (
            <div className="truncate text-sm text-slate-500">{slot.label}</div>
          ) : null}
        </div>
        {disabled ? (
          <span className="shrink-0 rounded-lg bg-slate-100 px-3.5 py-2 text-sm font-semibold text-slate-400">
            {past ? "עבר" : full ? "מלא" : "סגור"}
          </span>
        ) : (
          <Link
            href={`/book/${slot.id}`}
            className="shrink-0 rounded-lg bg-brand px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:brightness-110"
          >
            שיבוץ
          </Link>
        )}
      </div>

      <div className="mt-3">
        <div className={`fill-bar ${full ? "is-full" : ""}`}>
          <i style={{ width: `${Math.max(pct, 4)}%` }} />
        </div>
        <div className="mt-1.5 flex items-center justify-between text-xs text-slate-500">
          <span>
            {slot.taken}/{slot.capacity} משובצים
          </span>
          <span className="font-medium text-slate-600">
            {past ? "החלון עבר" : !slot.isOpen ? "סגור להרשמה" : full ? "אין מקום" : `${free} פנויים`}
          </span>
        </div>
      </div>
    </li>
  );
}

export default async function HomePage() {
  const cycles = await getPublishedCycles();
  const allSlots = cycles.flatMap((c) => [...c.briefings, ...c.sims]);
  const openSeats = allSlots
    .filter((s) => s.isOpen && !isPast(s.endsAt))
    .reduce((n, s) => n + Math.max(0, s.capacity - s.taken), 0);

  return (
    <div className="min-h-full bg-slate-50">
      <SiteHeader />

      {/* Hero */}
      <section className="sky-deep relative overflow-hidden text-white">
        <div className="tape pointer-events-none absolute inset-x-0 bottom-0 h-px opacity-40" />
        <div className="mx-auto grid max-w-4xl items-center gap-6 px-4 py-10 sm:grid-cols-[1fr_auto] sm:py-14">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-sky-200 ring-1 ring-white/15">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Full Flight Simulator · Airbus A320
            </span>
            <h1 className="mt-3 text-2xl font-extrabold leading-tight sm:text-3xl">
              שיבוץ עצמי לסימולטור ה־A320
            </h1>
            <p className="mt-2 max-w-lg text-sm text-sky-100/85">
              בוחרים חלון ל<strong>תדריך</strong> ולאחריו סבב <strong>סימולטור</strong> לזוג.
              נדרשים שם מלא ומספר טלפון בלבד — בלי הרשמה וסיסמאות.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-sm">
              <a
                href="#cycles"
                className="rounded-lg bg-white px-4 py-2 font-bold text-brand-deep shadow-sm transition hover:brightness-95"
              >
                למחזורים הפתוחים
              </a>
              <Link
                href="/my"
                className="rounded-lg px-4 py-2 font-semibold text-white ring-1 ring-white/25 transition hover:bg-white/10"
              >
                לצפייה / ביטול
              </Link>
            </div>
          </div>

          <div className="relative hidden h-40 w-40 sm:block">
            <div className="absolute inset-0 rounded-full bg-sky-400/10 blur-2xl" />
            <PlaneMark className="float-plane relative h-40 w-40 text-white/90 drop-shadow-[0_10px_30px_rgba(56,132,255,0.35)]" />
          </div>
        </div>

        <div className="border-t border-white/10 bg-black/10">
          <dl className="mx-auto grid max-w-4xl grid-cols-3 divide-x divide-white/10 px-4 text-center [direction:ltr]">
            {[
              { k: "מחזורים פתוחים", v: cycles.length },
              { k: "חלונות זמן", v: allSlots.length },
              { k: "מקומות פנויים", v: openSeats },
            ].map((s) => (
              <div key={s.k} className="py-3" dir="rtl">
                <dd className="text-xl font-extrabold tabular-nums">{s.v}</dd>
                <dt className="text-[11px] font-medium text-sky-100/70">{s.k}</dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <main id="cycles" className="mx-auto max-w-4xl px-4 py-8">
        {cycles.length === 0 ? (
          <div className="a-card grid place-items-center gap-2 p-12 text-center">
            <PlaneMark className="h-10 w-10 text-slate-300" />
            <p className="text-slate-500">אין כרגע מחזורים פתוחים לשיבוץ.</p>
            <p className="text-sm text-slate-400">כשמנהל יפרסם מחזור הוא יופיע כאן.</p>
          </div>
        ) : (
          <div className="space-y-10">
            {cycles.map(({ cycle, briefings, sims }) => (
              <section key={cycle.id}>
                <div className="mb-3 flex items-baseline gap-2">
                  <h2 className="text-lg font-extrabold text-slate-900">{cycle.name}</h2>
                  <span className="text-sm text-slate-500">
                    {fmtWeekday(cycle.eventDate + "T12:00:00")} · {fmtDate(cycle.eventDate + "T12:00:00")}
                  </span>
                </div>
                {cycle.notes ? (
                  <p className="mb-3 text-sm text-slate-500">{cycle.notes}</p>
                ) : null}

                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700">
                      <KindIcon kind="briefing" className="h-4 w-4 text-brand" />
                      תדריך והסבר תאורטי
                    </h3>
                    {briefings.length === 0 ? (
                      <p className="text-sm text-slate-400">אין חלונות תדריך.</p>
                    ) : (
                      <ul className="space-y-2.5">
                        {briefings.map((s) => (
                          <SlotCard key={s.id} slot={s} />
                        ))}
                      </ul>
                    )}
                  </div>

                  <div>
                    <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700">
                      <KindIcon kind="sim" className="h-4 w-4 text-brand" />
                      סבב סימולטור · זוג · חצי שעה
                    </h3>
                    {sims.length === 0 ? (
                      <p className="text-sm text-slate-400">אין חלונות סימולטור.</p>
                    ) : (
                      <ul className="space-y-2.5">
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

        <p className="mt-10 flex items-center justify-center gap-2 text-xs text-slate-400">
          <PlaneMark className="h-4 w-4" />
          HSL · Airbus A320 Full Flight Simulator
        </p>
      </main>
    </div>
  );
}
