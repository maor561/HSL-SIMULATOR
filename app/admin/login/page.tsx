import Link from "next/link";
import { redirect } from "next/navigation";
import { isAuthed } from "@/lib/auth";
import { LoginForm } from "./LoginForm";
import { PlaneMark } from "@/components/PlaneMark";

export const dynamic = "force-dynamic";
export const metadata = { title: "כניסת אדמין · A320 SIM" };

export default async function AdminLoginPage() {
  if (await isAuthed()) redirect("/admin");

  return (
    <div className="sky-deep grid min-h-screen place-items-center px-4 text-white">
      <div className="w-full max-w-sm">
        <div className="mb-5 flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/10 ring-1 ring-white/15">
            <PlaneMark className="h-6 w-6 text-white" />
          </span>
          <div className="leading-tight">
            <div className="text-[15px] font-extrabold tracking-tight">HSL · A320 SIM</div>
            <div className="text-[11px] text-sky-200/80">מערכת ניהול</div>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 text-slate-900 shadow-2xl">
          <h1 className="text-xl font-extrabold">כניסת מנהל</h1>
          <p className="mt-1 text-sm text-slate-500">הזן את סיסמת הניהול כדי להמשיך.</p>
          <div className="mt-5">
            <LoginForm />
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-sky-200/60">
          גישה מוגבלת · לרישום עצמי חזרו ל<Link href="/" className="underline">דף הבית</Link>
        </p>
      </div>
    </div>
  );
}
