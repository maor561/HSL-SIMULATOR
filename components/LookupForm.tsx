"use client";

import { useActionState } from "react";
import { lookupBookings, type FormState } from "@/lib/actions";
import { SubmitButton } from "./SubmitButton";

const initial: FormState = {};

export function LookupForm() {
  const [state, formAction] = useActionState(lookupBookings, initial);

  return (
    <form action={formAction} className="space-y-4">
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
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
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
          dir="ltr"
          required
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
      <SubmitButton className="w-full">הצגת השיבוצים שלי</SubmitButton>
    </form>
  );
}
