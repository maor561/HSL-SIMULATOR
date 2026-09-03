import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { adminLogout } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function DashLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-5">
            <Link href="/admin" className="text-base font-bold text-slate-900">
              ניהול · סימולטור
            </Link>
            <Link href="/display" className="text-sm text-slate-500 hover:text-slate-900">
              מסך הקרנה ↗
            </Link>
            <Link href="/" className="text-sm text-slate-500 hover:text-slate-900">
              אתר ציבורי ↗
            </Link>
          </div>
          <form action={adminLogout}>
            <button className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100">
              יציאה
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
