import Link from "next/link";
import { Brand } from "./Brand";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/85 backdrop-blur">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-2.5">
        <Brand />
        <nav className="flex items-center gap-1 text-sm">
          <Link
            href="/my"
            className="rounded-lg px-3 py-1.5 font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          >
            השיבוצים שלי
          </Link>
          <Link
            href="/display"
            className="rounded-lg px-3 py-1.5 font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          >
            מסך הקרנה
          </Link>
        </nav>
      </div>
    </header>
  );
}
