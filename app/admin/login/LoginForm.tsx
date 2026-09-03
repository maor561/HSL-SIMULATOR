"use client";

import { useActionState } from "react";
import { adminLogin, type FormState } from "@/lib/actions";
import { SubmitButton } from "@/components/SubmitButton";

const initial: FormState = {};

export function LoginForm() {
  const [state, formAction] = useActionState(adminLogin, initial);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
          סיסמה
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        />
      </div>
      {state.error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {state.error}
        </div>
      ) : null}
      <SubmitButton className="w-full">כניסה</SubmitButton>
    </form>
  );
}
