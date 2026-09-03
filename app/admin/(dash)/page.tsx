import Link from "next/link";
import { adminListCycles } from "@/lib/queries";
import { setCyclePublished } from "@/lib/actions";
import { CreateCycleForm } from "./CreateCycleForm";
import { fmtDate, fmtWeekday } from "@/lib/time";

export const dynamic = "force-dynamic";

function Stat({ label, value, accent = false }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className={`a-card p-4 ${accent ? "ring-1 ring-brand/20" : ""}`}>
      <div className="text-2xl font-extrabold tabular-nums text-slate-900">{value}</div>
      <div className="text-xs font-medium text-slate-500">{label}</div>
    </div>
  );
}

export default async function AdminHome() {
  const cycles = await adminListCycles();
  const published = cycles.filter((c) => c.isPublished).length;
  const bookings = cycles.reduce((n, c) => n + c.bookingCount, 0);
  const slots = cycles.reduce((n, c) => n + c.slotCount, 0);

  return (
    <div className="space-y-8">
      <section>
        <div className="flex items-end justify-between gap-3">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">לוח בקרה</h1>
            <p className="mt-0.5 text-sm text-slate-500">ניהול מחזורים, חלונות זמן ושיבוצים.</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="מחזורים" value={cycles.length} />
          <Stat label="מפורסמים" value={published} accent />
          <Stat label="חלונות זמן" value={slots} />
          <Stat label="שיבוצים פעילים" value={bookings} />
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-bold text-slate-700">מחזור חדש</h2>
        <div className="a-card p-4">
          <CreateCycleForm />
        </div>
        <p className="mt-1.5 text-xs text-slate-400">
          לאחר יצירה מוסיפים חלונות תדריך וסימולטור, ואז «פרסם» כדי לחשוף לשיבוץ ולמסך ההקרנה.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-bold text-slate-700">כל המחזורים</h2>
        {cycles.length === 0 ? (
          <div className="a-card grid place-items-center gap-1 p-10 text-center text-slate-500">
            <span className="text-3xl">🛫</span>
            אין מחזורים עדיין — צרו את הראשון למעלה.
          </div>
        ) : (
          <ul className="space-y-3">
            {cycles.map((c) => (
              <li key={c.id} className="a-card a-card-hover flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/admin/cycles/${c.id}`}
                      className="font-extrabold text-slate-900 hover:text-brand"
                    >
                      {c.name}
                    </Link>
                    {c.isPublished ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                        ● מפורסם
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-500">
                        טיוטה
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 text-sm text-slate-500">
                    {fmtWeekday(c.eventDate + "T12:00:00")} · {fmtDate(c.eventDate + "T12:00:00")}
                    <span className="mx-1.5 text-slate-300">|</span>
                    {c.slotCount} חלונות
                    <span className="mx-1.5 text-slate-300">|</span>
                    {c.bookingCount} שיבוצים
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <form action={setCyclePublished}>
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="publish" value={c.isPublished ? "0" : "1"} />
                    <button className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100">
                      {c.isPublished ? "בטל פרסום" : "פרסם"}
                    </button>
                  </form>
                  <Link
                    href={`/admin/cycles/${c.id}`}
                    className="rounded-lg bg-brand px-3 py-1.5 text-sm font-bold text-white hover:brightness-110"
                  >
                    ניהול
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
