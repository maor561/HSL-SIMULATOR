"use client";

import { useActionState } from "react";
import { retimeSlot, type FormState } from "@/lib/actions";
import { SubmitButton } from "@/components/SubmitButton";

const field =
  "rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200";

export function SlotRetime({
  slotId,
  cycleId,
  startTime,
  minutes,
}: {
  slotId: string;
  cycleId: string;
  startTime: string;
  minutes: number;
}) {
  const [state, formAction] = useActionState(retimeSlot, {} as FormState);

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="slotId" value={slotId} />
      <input type="hidden" name="cycleId" value={cycleId} />
      <input
        name="startTime"
        type="time"
        defaultValue={startTime}
        required
        className={`${field} w-[6.5rem] tabular-nums`}
        aria-label="שעת התחלה"
      />
      <span className="text-xs text-slate-400">משך</span>
      <input
        name="minutes"
        type="number"
        min={5}
        max={240}
        defaultValue={minutes}
        required
        className={`${field} w-16 tabular-nums`}
        aria-label="משך בדקות"
      />
      <label className="flex items-center gap-1 text-xs text-slate-500">
        <input type="checkbox" name="cascade" value="1" defaultChecked className="accent-blue-600" />
        דחוף את הבאים
      </label>
      <SubmitButton variant="ghost" pendingText="שומר…">
        שמור
      </SubmitButton>
      {state.ok ? <span className="text-xs text-emerald-600">✓</span> : null}
      {state.error ? <span className="text-xs text-rose-600">{state.error}</span> : null}
    </form>
  );
}
