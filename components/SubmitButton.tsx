"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({
  children,
  pendingText,
  className = "",
  variant = "primary",
}: {
  children: React.ReactNode;
  pendingText?: string;
  className?: string;
  variant?: "primary" | "danger" | "ghost";
}) {
  const { pending } = useFormStatus();
  const base =
    "inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed";
  const styles = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    danger: "bg-rose-600 text-white hover:bg-rose-700",
    ghost: "border border-slate-300 text-slate-700 hover:bg-slate-100",
  }[variant];
  return (
    <button type="submit" disabled={pending} className={`${base} ${styles} ${className}`}>
      {pending ? (pendingText ?? "רגע…") : children}
    </button>
  );
}
