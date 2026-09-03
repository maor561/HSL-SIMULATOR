"use client";

import { useActionState, useState } from "react";
import { createSlot, type FormState } from "@/lib/actions";
import { SubmitButton } from "@/components/SubmitButton";

const initial: FormState = {};
const field =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200";

export function AddSlotForm({
  cycleId,
  defaultDate,
}: {
  cycleId: string;
  defaultDate: string;
}) {
  const [state, formAction] = useActionState(createSlot, initial);
  const [kind, setKind] = useState<"briefing" | "sim">("briefing");

  return (
    <form action={formAction} className="grid gap-3 md:grid-cols-3">
      <input type="hidden" name="cycleId" value={cycleId} />

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">סוג</label>
        <select
          name="kind"
          value={kind}
          onChange={(e) => setKind(e.target.value as "briefing" | "sim")}
          className={field}
        >
          <option value="briefing">תדריך (קבוצתי)</option>
          <option value="sim">סימולטור (זוג)</option>
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">תיאור (רשות)</label>
        <input name="label" className={field} placeholder="כיתה 2 / תרחיש מנוע" />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">קיבולת</label>
        <input
          name="capacity"
          type="number"
          min={1}
          max={50}
          required
          key={kind}
          defaultValue={kind === "briefing" ? 10 : 2}
          className={field}
        />
        {state.fieldErrors?.capacity ? (
          <p className="mt-1 text-xs text-rose-600">{state.fieldErrors.capacity}</p>
        ) : null}
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">תאריך</label>
        <input name="date" type="date" required defaultValue={defaultDate} className={field} />
        {state.fieldErrors?.date ? (
          <p className="mt-1 text-xs text-rose-600">{state.fieldErrors.date}</p>
        ) : null}
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">שעת התחלה</label>
        <input name="startTime" type="time" required className={field} />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">שעת סיום</label>
        <input name="endTime" type="time" required className={field} />
        {state.fieldErrors?.endTime ? (
          <p className="mt-1 text-xs text-rose-600">{state.fieldErrors.endTime}</p>
        ) : null}
      </div>

      <div className="md:col-span-3">
        <SubmitButton>הוספת חלון</SubmitButton>
        {state.error ? (
          <span className="mr-3 text-xs text-rose-600">{state.error}</span>
        ) : null}
        {state.ok ? (
          <span className="mr-3 text-xs text-emerald-600">נוסף ✓</span>
        ) : null}
      </div>
    </form>
  );
}
