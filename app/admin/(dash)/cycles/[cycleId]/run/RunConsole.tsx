"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { startSlot, finishSlot, resetSlotRun, nudgeFrom } from "@/lib/actions";

export type RunSlot = {
  id: string;
  kind: "briefing" | "sim";
  label: string | null;
  startsAt: string;
  endsAt: string;
  capacity: number;
  taken: number;
  actualStartAt: string | null;
  actualEndAt: string | null;
};

const TZ = "Asia/Jerusalem";
const timeFmt = new Intl.DateTimeFormat("he-IL", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false });
const clockFmt = new Intl.DateTimeFormat("he-IL", {
  timeZone: TZ,
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});
const dateFmt = new Intl.DateTimeFormat("he-IL", { timeZone: TZ, weekday: "long", day: "2-digit", month: "2-digit" });

const T = (s: string) => timeFmt.format(new Date(s));
const mins = (ms: number) => Math.max(0, Math.round(ms / 60_000));

function Btn({
  children,
  tone = "slate",
}: {
  children: React.ReactNode;
  tone?: "green" | "amber" | "slate" | "rose";
}) {
  const { pending } = useFormStatus();
  const cls = {
    green: "bg-emerald-500/20 text-emerald-300 ring-emerald-400/30 hover:bg-emerald-500/30",
    amber: "bg-amber-500/20 text-amber-200 ring-amber-400/30 hover:bg-amber-500/30",
    slate: "bg-white/10 text-slate-200 ring-white/15 hover:bg-white/20",
    rose: "bg-rose-500/15 text-rose-300 ring-rose-400/30 hover:bg-rose-500/25",
  }[tone];
  return (
    <button
      type="submit"
      disabled={pending}
      className={`rounded-lg px-3 py-2 text-sm font-bold ring-1 transition disabled:opacity-50 ${cls}`}
    >
      {pending ? "…" : children}
    </button>
  );
}

function Nudge({ slotId, cycleId, minutes }: { slotId: string; cycleId: string; minutes: number }) {
  return (
    <form action={nudgeFrom}>
      <input type="hidden" name="slotId" value={slotId} />
      <input type="hidden" name="cycleId" value={cycleId} />
      <input type="hidden" name="minutes" value={minutes} />
      <Btn tone="slate">{minutes > 0 ? `+${minutes}` : minutes} דק׳</Btn>
    </form>
  );
}

function SlotRow({ s, cycleId, now }: { s: RunSlot; cycleId: string; now: number }) {
  const plannedStart = new Date(s.startsAt).getTime();
  const plannedEnd = new Date(s.endsAt).getTime();
  const started = !!s.actualStartAt;
  const finished = !!s.actualEndAt;

  let pill: { text: string; cls: string };
  let sub: React.ReactNode = null;
  if (finished) {
    pill = { text: "הסתיים", cls: "bg-white/10 text-slate-400" };
    sub = (
      <span className="text-slate-400">
        בפועל {T(s.actualStartAt ?? s.startsAt)}–{T(s.actualEndAt!)}
      </span>
    );
  } else if (started) {
    const over = now > plannedEnd ? mins(now - plannedEnd) : 0;
    pill = {
      text: s.kind === "briefing" ? "תדריך" : "בטיסה",
      cls: "bg-emerald-500/20 text-emerald-300 board-blink",
    };
    sub = (
      <span className="text-emerald-300/90">
        התחיל {T(s.actualStartAt!)} · רץ {mins(now - new Date(s.actualStartAt!).getTime())} דק׳
        {over > 0 ? <span className="text-amber-300"> · חורג {over} דק׳</span> : null}
      </span>
    );
  } else if (now >= plannedStart) {
    pill = { text: `מאחר ${mins(now - plannedStart)} דק׳`, cls: "bg-amber-500/20 text-amber-200" };
  } else {
    const m = mins(plannedStart - now);
    pill = {
      text: m >= 60 ? `בעוד ${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")} שע׳` : `בעוד ${m} דק׳`,
      cls: "bg-white/10 text-slate-300",
    };
  }

  return (
    <li className="rounded-xl bg-[var(--board-panel)] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-lg font-bold tabular-nums text-[var(--board-text)]">
              {T(s.startsAt)}–{T(s.endsAt)}
            </span>
            <span className="rounded px-1.5 py-0.5 text-[11px] font-bold text-[var(--board-amber)] ring-1 ring-[var(--board-amber)]/25">
              {s.kind === "briefing" ? "תדריך" : "טיסה"}
            </span>
            {s.label ? <span className="text-sm text-[var(--board-dim)]">{s.label}</span> : null}
          </div>
          <div className="mt-1 text-sm">
            {sub ?? <span className="text-[var(--board-dim)]">מתוכנן · {s.taken}/{s.capacity} משובצים</span>}
          </div>
        </div>
        <span className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-bold ${pill.cls}`}>{pill.text}</span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-white/10 pt-3">
        {!started && !finished ? (
          <form action={startSlot}>
            <input type="hidden" name="slotId" value={s.id} />
            <input type="hidden" name="cycleId" value={cycleId} />
            <Btn tone="green">▶ התחל עכשיו</Btn>
          </form>
        ) : null}

        {started && !finished ? (
          <form action={finishSlot}>
            <input type="hidden" name="slotId" value={s.id} />
            <input type="hidden" name="cycleId" value={cycleId} />
            <Btn tone="amber">■ סיים עכשיו</Btn>
          </form>
        ) : null}

        {finished || started ? (
          <form action={resetSlotRun}>
            <input type="hidden" name="slotId" value={s.id} />
            <input type="hidden" name="cycleId" value={cycleId} />
            <Btn tone="rose">↺ בטל סימון</Btn>
          </form>
        ) : null}

        {!finished ? (
          <div className="ms-auto flex items-center gap-2">
            <span className="text-xs text-[var(--board-dim)]">דחיפת החלון והבאים:</span>
            <Nudge slotId={s.id} cycleId={cycleId} minutes={-5} />
            <Nudge slotId={s.id} cycleId={cycleId} minutes={5} />
          </div>
        ) : null}
      </div>
    </li>
  );
}

export function RunConsole({
  cycleId,
  cycleName,
  eventDate,
  slots,
}: {
  cycleId: string;
  cycleName: string;
  eventDate: string;
  slots: RunSlot[];
}) {
  const router = useRouter();
  const [now, setNow] = useState(() => Date.now());
  const [clock, setClock] = useState("");

  useEffect(() => {
    const tick = () => {
      setNow(Date.now());
      setClock(clockFmt.format(new Date()));
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  // רענון מהשרת — לכידת שינויים ושמירה על מונים מעודכנים
  useEffect(() => {
    const t = setInterval(() => router.refresh(), 15_000);
    return () => clearInterval(t);
  }, [router]);

  return (
    <div className="board rounded-2xl p-5 md:p-7">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--board-line)] pb-4">
        <div>
          <Link
            href={`/admin/cycles/${cycleId}`}
            className="text-sm text-[var(--board-dim)] hover:text-[var(--board-text)]"
          >
            → חזרה לעריכת המחזור
          </Link>
          <h1 className="mt-1 text-2xl font-extrabold text-[var(--board-text)]">מצב הפעלה · {cycleName}</h1>
          <div className="text-sm text-[var(--board-dim)]">
            {dateFmt.format(new Date(eventDate + "T12:00:00"))} · סימון «התחל / סיים» מעדכן את הזמנים אוטומטית
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/display"
            target="_blank"
            className="rounded-lg bg-white/10 px-3 py-2 text-sm font-semibold text-[var(--board-text)] ring-1 ring-white/15 hover:bg-white/20"
          >
            מסך הקרנה ↗
          </Link>
          <div className="font-mono text-3xl font-bold tabular-nums text-[var(--board-text)]" suppressHydrationWarning>
            {clock}
          </div>
        </div>
      </header>

      {slots.length === 0 ? (
        <p className="py-10 text-center text-[var(--board-dim)]">אין חלונות במחזור הזה.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {slots.map((s) => (
            <SlotRow key={s.id} s={s} cycleId={cycleId} now={now} />
          ))}
        </ul>
      )}
    </div>
  );
}
