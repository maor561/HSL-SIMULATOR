"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookingForm } from "./BookingForm";
import { PlaneMark } from "./PlaneMark";

export type RSlot = {
  id: string;
  kind: "briefing" | "sim";
  label: string | null;
  startsAt: string;
  endsAt: string;
  capacity: number;
  isOpen: boolean;
  taken: number;
};
export type RCycle = {
  id: string;
  name: string;
  eventDate: string;
  briefings: RSlot[];
  sims: RSlot[];
};

const TZ = "Asia/Jerusalem";
const t = (o: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("he-IL", { timeZone: TZ, hour12: false, ...o });
const timeFmt = t({ hour: "2-digit", minute: "2-digit" });
const dateFmt = t({ weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" });
const range = (a: string, b: string) =>
  `${timeFmt.format(new Date(a))}–${timeFmt.format(new Date(b))}`;

function firstAvailable(cycles: RCycle[], now: number) {
  const i = cycles.findIndex((c) =>
    [...c.briefings, ...c.sims].some(
      (s) => s.isOpen && s.taken < s.capacity && new Date(s.endsAt).getTime() >= now,
    ),
  );
  return i >= 0 ? i : 0;
}

export function RegisterBoard({ cycles }: { cycles: RCycle[] }) {
  const router = useRouter();
  const [now, setNow] = useState(() => Date.now());
  const [idx, setIdx] = useState(() => firstAvailable(cycles, Date.now()));
  const [selected, setSelected] = useState<RSlot | null>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const safeIdx = Math.min(idx, Math.max(0, cycles.length - 1));
  const cycle = cycles[safeIdx];

  const nav = useCallback(
    (dir: number) => {
      const n = cycles.length;
      if (!n) return;
      setSelected(null);
      setIdx((i) => (((i + dir) % n) + n) % n);
    },
    [cycles.length],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (selected) return;
      if (e.key === "ArrowRight" || e.key === "ArrowUp") nav(-1);
      else if (e.key === "ArrowLeft" || e.key === "ArrowDown") nav(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [nav, selected]);

  const navBtn =
    "select-none rounded-xl bg-white/10 px-4 py-2.5 text-sm font-bold ring-1 ring-white/15 hover:bg-white/20 sm:px-6 sm:text-base";

  return (
    <div className="board flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-[var(--board-line)] px-4 py-3 sm:px-8">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 ring-1 ring-white/15">
            <PlaneMark className="h-5 w-5 text-white" />
          </span>
          <div className="leading-tight">
            <div className="text-[15px] font-extrabold tracking-tight">רישום · סימולטור A320</div>
            <div className="text-[11px] text-[var(--board-dim)]">שם מלא וטלפון בלבד</div>
          </div>
        </div>
        <Link
          href="/my"
          className="rounded-lg px-3 py-1.5 text-sm font-medium text-[var(--board-dim)] hover:bg-white/10 hover:text-[var(--board-text)]"
        >
          השיבוצים שלי
        </Link>
      </header>

      {cycles.length === 0 || !cycle ? (
        <div className="grid flex-1 place-items-center px-4 text-center text-lg text-[var(--board-dim)]">
          אין כרגע מחזורים פתוחים לשיבוץ.
        </div>
      ) : (
        <>
          <nav className="flex items-center justify-between gap-3 px-4 py-4 sm:px-8">
            <button onClick={() => nav(-1)} className={navBtn} aria-label="המחזור הקודם">
              › הקודם
            </button>
            <div className="min-w-0 flex-1 text-center">
              <div className="truncate text-xl font-extrabold sm:text-2xl">{cycle.name}</div>
              <div className="mt-0.5 text-xs text-[var(--board-dim)] sm:text-sm">
                {dateFmt.format(new Date(cycle.eventDate + "T12:00:00"))}
                <span className="mx-2 opacity-40">·</span>
                מחזור {safeIdx + 1} מתוך {cycles.length}
              </div>
            </div>
            <button onClick={() => nav(1)} className={navBtn} aria-label="המחזור הבא">
              הבא ‹
            </button>
          </nav>

          <main className="mx-auto grid w-full max-w-5xl flex-1 gap-6 px-4 pb-10 sm:px-8 md:grid-cols-2">
            <Section
              title="תדריך והסבר תאורטי"
              slots={cycle.briefings}
              now={now}
              onPick={setSelected}
              empty="אין חלונות תדריך במחזור זה."
            />
            <Section
              title="סבב סימולטור · זוג · חצי שעה"
              slots={cycle.sims}
              now={now}
              onPick={setSelected}
              empty="אין חלונות סימולטור במחזור זה."
              note="נדרש שיבוץ פעיל לתדריך של אותו מחזור."
            />
          </main>
        </>
      )}

      {selected && cycle ? (
        <BookingModal
          slot={selected}
          cycle={cycle}
          onClose={() => setSelected(null)}
          onDone={() => {
            setSelected(null);
            router.refresh();
          }}
        />
      ) : null}
    </div>
  );
}

function Section({
  title,
  slots,
  now,
  onPick,
  empty,
  note,
}: {
  title: string;
  slots: RSlot[];
  now: number;
  onPick: (s: RSlot) => void;
  empty: string;
  note?: string;
}) {
  return (
    <section>
      <h2 className="mb-1 text-sm font-bold uppercase tracking-wide text-[var(--board-amber)]">
        {title}
      </h2>
      {note ? <p className="mb-2 text-xs text-[var(--board-dim)]">{note}</p> : null}
      {slots.length === 0 ? (
        <p className="text-sm text-[var(--board-dim)]">{empty}</p>
      ) : (
        <ul className="space-y-2.5">
          {slots.map((s) => (
            <SlotCard key={s.id} s={s} now={now} onPick={onPick} />
          ))}
        </ul>
      )}
    </section>
  );
}

function SlotCard({
  s,
  now,
  onPick,
}: {
  s: RSlot;
  now: number;
  onPick: (s: RSlot) => void;
}) {
  const past = new Date(s.endsAt).getTime() < now;
  const free = Math.max(0, s.capacity - s.taken);
  const full = free === 0;
  const ok = s.isOpen && !past && !full;
  const pct = Math.round((s.taken / s.capacity) * 100);

  return (
    <li>
      <button
        type="button"
        disabled={!ok}
        onClick={() => onPick(s)}
        className={`w-full rounded-xl bg-[var(--board-panel)] p-4 text-right ring-1 ring-white/5 transition ${
          ok
            ? "hover:ring-2 hover:ring-[var(--board-green)]/50"
            : "cursor-not-allowed opacity-45"
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <span className="font-mono text-lg font-bold tabular-nums">
            {range(s.startsAt, s.endsAt)}
          </span>
          <span
            className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-bold ${
              ok
                ? "bg-[var(--board-green)]/20 text-[var(--board-green)]"
                : "bg-white/10 text-[var(--board-dim)]"
            }`}
          >
            {past ? "עבר" : full ? "מלא" : !s.isOpen ? "סגור" : `${free} פנויים`}
          </span>
        </div>
        {s.label ? (
          <div className="mt-1 text-sm text-[var(--board-dim)]">{s.label}</div>
        ) : null}
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
          <span
            className={`block h-full rounded-full ${full ? "bg-rose-400" : "bg-[var(--board-green)]"}`}
            style={{ width: `${Math.max(pct, 3)}%` }}
          />
        </div>
        <div className="mt-1 text-[11px] text-[var(--board-dim)]">
          {s.taken}/{s.capacity} משובצים
        </div>
      </button>
    </li>
  );
}

function BookingModal({
  slot,
  cycle,
  onClose,
  onDone,
}: {
  slot: RSlot;
  cycle: RCycle;
  onClose: () => void;
  onDone: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 text-slate-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-bold uppercase tracking-wide text-blue-600">
              {slot.kind === "briefing" ? "תדריך והסבר תאורטי" : "סבב סימולטור · A320"}
            </div>
            <h2 className="mt-0.5 text-lg font-extrabold">{cycle.name}</h2>
            <div className="text-sm text-slate-500">
              {dateFmt.format(new Date(cycle.eventDate + "T12:00:00"))}
              <br />
              {range(slot.startsAt, slot.endsAt)}
              {slot.label ? ` · ${slot.label}` : ""}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="סגור"
            className="rounded-lg p-1.5 text-xl leading-none text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            ✕
          </button>
        </div>

        {slot.kind === "sim" ? (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            צריך שיבוץ פעיל לתדריך של מחזור זה עם אותו מספר טלפון.
          </div>
        ) : null}

        <hr className="my-5 border-slate-200" />
        <BookingForm slotId={slot.id} kind={slot.kind} onDone={onDone} />
      </div>
    </div>
  );
}
