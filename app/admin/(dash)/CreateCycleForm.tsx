"use client";

import { useActionState } from "react";
import { createCycle, type FormState } from "@/lib/actions";
import { SubmitButton } from "@/components/SubmitButton";

const initial: FormState = {};
const field =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200";
const num = `${field} tabular-nums`;

export function CreateCycleForm() {
  const [state, formAction] = useActionState(createCycle, initial);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-[1fr_9rem_7rem]">
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
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">שעת התחלה</label>
          <input name="startTime" type="time" required className={field} defaultValue="09:00" />
          {state.fieldErrors?.startTime ? (
            <p className="mt-1 text-xs text-rose-600">{state.fieldErrors.startTime}</p>
          ) : null}
        </div>
      </div>

      <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
        נוצר אוטומטית: <strong>תדריך</strong> 45 דק׳ / 10 חניכים, ואחריו <strong>5 סבבי סימולטור</strong>{" "}
        45 דק׳ / זוג — כל סבב מתחיל כשקודמו מסתיים. אפשר לשנות למטה ובעמוד המחזור.
      </p>

      <details className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
        <summary className="cursor-pointer font-medium text-slate-600">הגדרות מתקדמות</summary>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
          <label className="text-xs text-slate-600">
            תדריך — דקות
            <input name="briefingMinutes" type="number" min={5} max={240} defaultValue={45} className={num} />
          </label>
          <label className="text-xs text-slate-600">
            תדריך — חניכים
            <input name="briefingCapacity" type="number" min={1} max={50} defaultValue={10} className={num} />
          </label>
          <label className="text-xs text-slate-600">
            מס׳ סבבים
            <input name="simCount" type="number" min={0} max={20} defaultValue={5} className={num} />
          </label>
          <label className="text-xs text-slate-600">
            סבב — דקות
            <input name="simMinutes" type="number" min={5} max={240} defaultValue={45} className={num} />
          </label>
          <label className="text-xs text-slate-600">
            סבב — קיבולת
            <input name="simCapacity" type="number" min={1} max={20} defaultValue={2} className={num} />
          </label>
        </div>
      </details>

      <input type="hidden" name="notes" value="" />
      <div className="flex items-center gap-3">
        <SubmitButton pendingText="יוצר…">צור מחזור + לוח זמנים</SubmitButton>
        {state.error ? <span className="text-xs text-rose-600">{state.error}</span> : null}
      </div>
    </form>
  );
}
