import Link from "next/link";
import { PlaneMark } from "./PlaneMark";

export function Brand({
  href = "/",
  tone = "light",
  size = "md",
}: {
  href?: string;
  tone?: "light" | "dark";
  size?: "sm" | "md";
}) {
  const sub = tone === "dark" ? "text-sky-300/80" : "text-brand/80";
  const main = tone === "dark" ? "text-white" : "text-ink";
  const ring =
    tone === "dark"
      ? "bg-white/10 text-sky-200 ring-1 ring-white/15"
      : "bg-brand/10 text-brand ring-1 ring-brand/15";
  const box = size === "sm" ? "h-8 w-8" : "h-10 w-10";
  const plane = size === "sm" ? "h-5 w-5" : "h-6 w-6";

  return (
    <Link href={href} className="group inline-flex items-center gap-2.5">
      <span className={`grid place-items-center rounded-xl ${box} ${ring}`}>
        <PlaneMark className={`${plane} transition-transform group-hover:-translate-y-0.5`} />
      </span>
      <span className="leading-tight">
        <span className={`block text-[15px] font-extrabold tracking-tight ${main}`}>
          HSL <span className="font-semibold">·</span> A320 SIM
        </span>
        <span className={`block text-[11px] font-medium ${sub}`}>תיאום תורים לסימולטור</span>
      </span>
    </Link>
  );
}
