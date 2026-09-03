"use client";

import { useActionState } from "react";
import Link from "next/link";
import { bookSlot, type FormState } from "@/lib/actions";
import { SubmitButton } from "./SubmitButton";

const initial: FormState = {};

export function BookingForm({
  slotId,
  kind,
}: {
  slotId: string;
  kind: "briefing" | "sim";
}) {
  const [state, formAction] = useActionState(bookSlot, initial);

  if (state.ok) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <div className="text-lg font-bold text-emerald-800">השיבוץ נקלט ✓</div>
        <p className="mt-1 text-sm text-emerald-700">
          {kind === "briefing"
            ? "נרשמת לתדריך. עכשיו אפשר לתפוס גם חלון סימולטור באותו מחזור."
            : "נרשמת לסבב הסימולטור."}
        </p>
        <div className="mt-4 flex justify-center gap-3">
          <Link
            href="/my"
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            לשיבוצים שלי
          </Link>
          <Link
            href="/"
            className="rounded-lg border border-emerald-300 px-4 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-100"
          >
            חזרה לרשימה
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="slotId" value={slotId} />

      <div>
        <label htmlFor="fullName" className="mb-1 block text-sm font-medium text-slate-700">
          שם מלא
        </label>
        <input
          id="fullName"
          name="fullName"
          type="text"
          autoComplete="name"
          required
          defaultValue={state.values?.fullName ?? ""}
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          placeholder="ישראל ישראלי"
        />
        {state.fieldErrors?.fullName ? (
          <p className="mt-1 text-sm text-rose-600">{state.fieldErrors.fullName}</p>
        ) : null}
      </div>

      <div>
        <label htmlFor="phone" className="mb-1 block text-sm font-medium text-slate-700">
          טלפון נייד
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          required
          dir="ltr"
          defaultValue={state.values?.phone ?? ""}
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          placeholder="0501234567"
        />
        {state.fieldErrors?.phone ? (
          <p className="mt-1 text-sm text-rose-600">{state.fieldErrors.phone}</p>
        ) : null}
      </div>

      {state.error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {state.error}
        </div>
      ) : null}

      <SubmitButton className="w-full" pendingText="שולח…">
        אישור שיבוץ
      </SubmitButton>
    </form>
  );
}
