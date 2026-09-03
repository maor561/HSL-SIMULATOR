"use client";

import { useActionState } from "react";
import { updateCycle, type FormState } from "@/lib/actions";
import { SubmitButton } from "@/components/SubmitButton";

const field =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200";

export function EditCycleForm({
  id,
  name,
  eventDate,
  notes,
}: {
  id: string;
  name: string;
  eventDate: string;
  notes: string;
}) {
  const [state, formAction] = useActionState(updateCycle, {} as FormState);

  return (
    <form action={formAction} className="grid gap-3 md:grid-cols-[1fr_12rem]">
      <input type="hidden" name="id" value={id} />
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">שם מחזור</label>
        <input name="name" defaultValue={name} required className={field} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">תאריך</label>
        <input name="eventDate" type="date" defaultValue={eventDate} required className={field} />
      </div>
      <div className="md:col-span-2">
        <label className="mb-1 block text-xs font-medium text-slate-600">הערות (רשות)</label>
        <input name="notes" defaultValue={notes} className={field} />
      </div>
      <div className="md:col-span-2 flex items-center gap-3">
        <SubmitButton variant="ghost">שמירה</SubmitButton>
        {state.ok ? <span className="text-xs text-emerald-600">נשמר ✓</span> : null}
        {state.error ? <span className="text-xs text-rose-600">{state.error}</span> : null}
      </div>
    </form>
  );
}
