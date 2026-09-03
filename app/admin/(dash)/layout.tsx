import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { adminLogout } from "@/lib/actions";
import { Brand } from "@/components/Brand";

export const dynamic = "force-dynamic";

export default async function DashLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="sky-deep text-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <Brand href="/admin" tone="dark" size="sm" />
            <span className="rounded-full bg-amber-400/20 px-2.5 py-0.5 text-[11px] font-bold text-amber-200 ring-1 ring-amber-300/30">
              מצב ניהול
            </span>
          </div>
          <div className="flex items-center gap-1 text-sm">
            <Link
              href="/display"
              target="_blank"
              className="rounded-lg px-3 py-1.5 font-medium text-sky-100 hover:bg-white/10"
            >
              מסך הקרנה ↗
            </Link>
            <Link
              href="/"
              target="_blank"
              className="rounded-lg px-3 py-1.5 font-medium text-sky-100 hover:bg-white/10"
            >
              אתר ציבורי ↗
            </Link>
            <form action={adminLogout}>
              <button className="rounded-lg bg-white/10 px-3 py-1.5 font-semibold text-white ring-1 ring-white/20 hover:bg-white/20">
                יציאה
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
