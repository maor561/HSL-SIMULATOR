"use client";

import { useActionState } from "react";
import { cancelBooking, type FormState } from "@/lib/actions";
import { SubmitButton } from "./SubmitButton";

const initial: FormState = {};

export function CancelButton({
  bookingId,
  phone,
}: {
  bookingId: string;
  phone: string;
}) {
  const [state, formAction] = useActionState(cancelBooking, initial);

  if (state.ok) {
    return <span className="text-sm font-semibold text-slate-400">בוטל</span>;
  }

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!confirm("לבטל את השיבוץ?")) e.preventDefault();
      }}
    >
      <input type="hidden" name="bookingId" value={bookingId} />
      <input type="hidden" name="phone" value={phone} />
      <SubmitButton variant="ghost" pendingText="מבטל…">
        ביטול
      </SubmitButton>
      {state.error ? (
        <p className="mt-1 text-xs text-rose-600">{state.error}</p>
      ) : null}
    </form>
  );
}
