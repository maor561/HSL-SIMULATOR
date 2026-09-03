import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-base font-bold text-slate-900">
          תיאום תורים · סימולטור
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/my" className="text-slate-600 hover:text-slate-900">
            השיבוצים שלי
          </Link>
          <Link href="/display" className="text-slate-600 hover:text-slate-900">
            מסך הקרנה
          </Link>
        </nav>
      </div>
    </header>
  );
}
