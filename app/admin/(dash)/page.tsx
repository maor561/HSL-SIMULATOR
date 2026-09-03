import Link from "next/link";
import { adminListCycles } from "@/lib/queries";
import { setCyclePublished } from "@/lib/actions";
import { CreateCycleForm } from "./CreateCycleForm";
import { fmtDate } from "@/lib/time";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const cycles = await adminListCycles();

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-xl font-bold text-slate-900">מחזורים</h1>
        <p className="mt-1 text-sm text-slate-500">
          כל מחזור מכיל חלונות תדריך וחלונות סימולטור. פרסום מחזור חושף אותו לשיבוץ ולמסך ההקרנה.
        </p>
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
          <CreateCycleForm />
        </div>
      </section>

      <section>
        {cycles.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
            אין מחזורים עדיין.
          </div>
        ) : (
          <ul className="space-y-3">
            {cycles.map((c) => (
              <li
                key={c.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/cycles/${c.id}`}
                      className="font-semibold text-slate-900 hover:underline"
                    >
                      {c.name}
                    </Link>
                    {c.isPublished ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                        מפורסם
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">
                        טיוטה
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-slate-500">
                    {fmtDate(c.eventDate + "T12:00:00")} · {c.slotCount} חלונות · {c.bookingCount} שיבוצים
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
                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700"
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
