import Link from "next/link";
import { Brand } from "./Brand";
import { GUIDE_URL } from "@/lib/links";

export function SiteHeader() {
  const cls =
    "rounded-lg px-3 py-1.5 font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900";
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/85 backdrop-blur">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-2.5">
        <Brand />
        <nav className="flex items-center gap-1 text-sm">
          <a href={GUIDE_URL} target="_blank" rel="noopener noreferrer" className={cls}>
            מדריך ↗
          </a>
          <Link href="/my" className={cls}>
            השיבוצים שלי
          </Link>
          <Link href="/display" className={cls}>
            מסך הקרנה
          </Link>
        </nav>
      </div>
    </header>
  );
}
