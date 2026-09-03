import Link from "next/link";
import { getBookingsByPhone } from "@/lib/queries";
import { normalizePhone } from "@/lib/validation";
import { LookupForm } from "@/components/LookupForm";
import { CancelButton } from "@/components/CancelButton";
import { SiteHeader } from "@/components/SiteHeader";
import { fmtDate, fmtRange } from "@/lib/time";

export const dynamic = "force-dynamic";

export default async function MyPage({
  searchParams,
}: {
  searchParams: Promise<{ p?: string }>;
}) {
  const { p } = await searchParams;
  const phone = p ? normalizePhone(p) : "";
  const valid = /^0\d{8,9}$/.test(phone);
  const rows = valid ? await getBookingsByPhone(phone) : [];

  return (
    <div className="min-h-full bg-slate-50">
      <SiteHeader />
      <main className="mx-auto max-w-lg px-4 py-8">
        <h1 className="text-2xl font-extrabold text-slate-900">השיבוצים שלי</h1>

        {!valid ? (
          <>
            <p className="mt-2 text-sm text-slate-600">
              הזינו שם מלא וטלפון כדי לראות ולבטל שיבוצים.
            </p>
            <div className="a-card mt-6 p-6">
              <LookupForm />
            </div>
          </>
        ) : (
          <>
            <p className="mt-2 text-sm text-slate-600">
              שיבוצים פעילים עבור <span dir="ltr">{phone}</span>.{" "}
              <Link href="/my" className="text-blue-600 hover:underline">
                טלפון אחר
              </Link>
            </p>

            {rows.length === 0 ? (
              <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
                אין שיבוצים פעילים.{" "}
                <Link href="/" className="text-blue-600 hover:underline">
                  לרשימת המחזורים
                </Link>
              </div>
            ) : (
              <ul className="mt-6 space-y-3">
                {rows.map((b) => (
                  <li
                    key={b.id}
                    className="a-card flex items-center justify-between gap-3 p-4"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-semibold uppercase tracking-wide text-brand">
                        {b.kind === "briefing" ? "תדריך" : "סימולטור · A320"}
                      </div>
                      <div className="font-semibold text-slate-900">{b.cycleName}</div>
                      <div className="text-sm text-slate-500">
                        {fmtDate(b.cycleDate + "T12:00:00")} · {fmtRange(b.startsAt, b.endsAt)}
                        {b.slotLabel ? ` · ${b.slotLabel}` : ""}
                      </div>
                      <div className="text-xs text-slate-400">שם: {b.fullName}</div>
                    </div>
                    <CancelButton bookingId={b.id} phone={phone} />
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </main>
    </div>
  );
}
