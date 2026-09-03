import { redirect } from "next/navigation";
import { isAuthed } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "כניסת אדמין" };

export default async function AdminLoginPage() {
  if (await isAuthed()) redirect("/admin");

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900">כניסת אדמין</h1>
        <p className="mt-1 text-sm text-slate-500">נדרשת סיסמת ניהול.</p>
        <div className="mt-5">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
