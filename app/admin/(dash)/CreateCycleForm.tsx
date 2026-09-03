"use client";

import { useActionState } from "react";
import { createCycle, type FormState } from "@/lib/actions";
import { SubmitButton } from "@/components/SubmitButton";

const initial: FormState = {};
const field =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200";

export function CreateCycleForm() {
  const [state, formAction] = useActionState(createCycle, initial);

  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-[1fr_10rem_auto] sm:items-end">
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">שם מחזור</label>
        <input name="name" required className={field} placeholder="מחזור מרץ · צוות א׳" />
        {state.fieldErrors?.name ? (
          <p className="mt-1 text-xs text-rose-600">{state.fieldErrors.name}</p>
        ) : null}
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">תאריך</label>
        <input name="eventDate" type="date" required className={field} />
        {state.fieldErrors?.eventDate ? (
          <p className="mt-1 text-xs text-rose-600">{state.fieldErrors.eventDate}</p>
        ) : null}
      </div>
      <SubmitButton>מחזור חדש</SubmitButton>
      <input type="hidden" name="notes" value="" />
      {state.error ? (
        <p className="text-xs text-rose-600 sm:col-span-3">{state.error}</p>
      ) : null}
    </form>
  );
}
