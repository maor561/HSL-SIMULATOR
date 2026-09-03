"use client";

import { useActionState } from "react";
import { retimeCycle, type FormState } from "@/lib/actions";
import { SubmitButton } from "@/components/SubmitButton";

const field =
  "rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200";

export function RetimeCycleForm({
  cycleId,
  eventDate,
  startTime,
}: {
  cycleId: string;
  eventDate: string;
  startTime: string;
}) {
  const [state, formAction] = useActionState(retimeCycle, {} as FormState);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="cycleId" value={cycleId} />
      <label className="text-xs font-medium text-slate-600">
        תאריך
        <input name="eventDate" type="date" defaultValue={eventDate} required className={`mt-1 block ${field}`} />
      </label>
      <label className="text-xs font-medium text-slate-600">
        שעת התחלה (תדריך)
        <input name="startTime" type="time" defaultValue={startTime} required className={`mt-1 block ${field}`} />
      </label>
      <SubmitButton pendingText="מזיז…">עדכן ודחוף את כל הזמנים</SubmitButton>
      {state.ok ? <span className="text-xs text-emerald-600">עודכן ✓</span> : null}
      {state.error ? <span className="text-xs text-rose-600">{state.error}</span> : null}
    </form>
  );
}
