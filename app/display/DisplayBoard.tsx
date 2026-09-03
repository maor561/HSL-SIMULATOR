"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type FeedSlot = {
  slotId: string;
  kind: "briefing" | "sim";
  label: string | null;
  startsAt: string;
  endsAt: string;
  capacity: number;
  names: string[];
};
export type FeedCycle = {
  id: string;
  name: string;
  eventDate: string;
  slots: FeedSlot[];
};
export type Feed = { now: string; cycles: FeedCycle[] };

const TZ = "Asia/Jerusalem";
const t2 = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("he-IL", { timeZone: TZ, hour12: false, ...o });
const timeFmt = t2({ hour: "2-digit", minute: "2-digit" });
const clockFmt = t2({ hour: "2-digit", minute: "2-digit", second: "2-digit" });
const dateFmt = t2({ weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" });

const TERM = { briefing: "תדריך", sim: "טיסה" } as const;

type Status = { key: "done" | "now" | "boarding" | "soon"; label: string; cls: string };
function statusOf(s: FeedSlot, now: number): Status {
  const start = new Date(s.startsAt).getTime();
  const end = new Date(s.endsAt).getTime();
  if (now >= end) return { key: "done", label: "הסתיים", cls: "text-[var(--board-dim)]" };
  if (now >= start) return { key: "now", label: "עכשיו", cls: "text-[var(--board-green)] board-blink" };
  const mins = Math.ceil((start - now) / 60_000);
  if (mins <= 15) return { key: "boarding", label: "התייצבות", cls: "text-[var(--board-amber)]" };
  let label: string;
  if (mins >= 24 * 60) {
    const days = Math.round(mins / (24 * 60));
    label = days === 1 ? "מחר" : `בעוד ${days} ימים`;
  } else if (mins >= 60) {
    label = `בעוד ${Math.floor(mins / 60)}:${String(mins % 60).padStart(2, "0")} שע׳`;
  } else {
    label = `בעוד ${mins} דק׳`;
  }
  return { key: "soon", label, cls: "text-[var(--board-text)]" };
}

/** המחזור ה"חי" — הראשון שיש בו חלון שעדיין לא הסתיים */
function liveCycleIndex(cycles: FeedCycle[], now: number): number {
  const i = cycles.findIndex((c) => c.slots.some((s) => new Date(s.endsAt).getTime() >= now));
  return i >= 0 ? i : Math.max(0, cycles.length - 1);
}

const IDLE_MS = 45_000;

export function DisplayBoard({ initial }: { initial: Feed }) {
  const [feed, setFeed] = useState<Feed>(initial);
  const [now, setNow] = useState(() => Date.now());
  const [clock, setClock] = useState("");
  const [idx, setIdx] = useState(() => liveCycleIndex(initial.cycles, Date.now()));
  const [isFs, setIsFs] = useState(false);
  const lastInteraction = useRef(0);
  const heroKey = useRef("");
  const [heroFlip, setHeroFlip] = useState(false);

  const cycles = feed.cycles;
  const live = liveCycleIndex(cycles, now);
  const safeIdx = Math.min(idx, Math.max(0, cycles.length - 1));
  const cycle: FeedCycle | undefined = cycles[safeIdx];

  const nav = useCallback(
    (dir: number) => {
      lastInteraction.current = Date.now();
      setIdx((i) => {
        const n = cycles.length;
        if (n === 0) return 0;
        return (((i + dir) % n) + n) % n;
      });
    },
    [cycles.length],
  );
  const goLive = useCallback(() => {
    lastInteraction.current = Date.now();
    setIdx(liveCycleIndex(cycles, Date.now()));
  }, [cycles]);

  // שעון
  useEffect(() => {
    const tick = () => {
      setNow(Date.now());
      setClock(clockFmt.format(new Date()));
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  // רענון נתונים
  useEffect(() => {
    let alive = true;
    const pull = async () => {
      try {
        const r = await fetch("/api/display", { cache: "no-store" });
        if (!r.ok) return;
        const data = (await r.json()) as Feed;
        if (alive) setFeed(data);
      } catch {
        /* התעלמות משגיאת רשת רגעית */
      }
    };
    const t = setInterval(pull, 15_000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  // חזרה אוטומטית למחזור החי כשאין אינטראקציה
  useEffect(() => {
    if (Date.now() - lastInteraction.current > IDLE_MS && idx !== live) setIdx(live);
  }, [now, live, idx]);

  useEffect(() => {
    const onFs = () => setIsFs(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);
  const toggleFs = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else document.documentElement.requestFullscreen().catch(() => {});
  }, []);

  // מקשי חצים / רווח / F
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowUp") nav(-1);
      else if (e.key === "ArrowLeft" || e.key === "ArrowDown") nav(1);
      else if (e.key === "Home" || e.key === " ") goLive();
      else if (e.key.toLowerCase() === "f") toggleFs();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [nav, goLive, toggleFs]);

  const hero = useMemo(() => {
    if (!cycle) return null;
    const liveSlot = cycle.slots.find((s) => {
      const st = new Date(s.startsAt).getTime();
      const en = new Date(s.endsAt).getTime();
      return now >= st && now < en;
    });
    const next = cycle.slots.find((s) => new Date(s.endsAt).getTime() >= now);
    return liveSlot ?? next ?? cycle.slots[cycle.slots.length - 1] ?? null;
  }, [cycle, now]);

  useEffect(() => {
    const k = `${cycle?.id ?? ""}:${hero?.slotId ?? ""}`;
    if (heroKey.current && heroKey.current !== k) {
      setHeroFlip(true);
      const t = setTimeout(() => setHeroFlip(false), 500);
      return () => clearTimeout(t);
    }
    heroKey.current = k;
  }, [cycle?.id, hero?.slotId]);

  const navBtn =
    "select-none rounded-2xl bg-white/10 px-[1.6vw] py-[1vh] text-[clamp(1rem,2vw,2rem)] font-bold ring-1 ring-white/15 hover:bg-white/20 active:bg-white/25";

  return (
    <div className="board flex h-screen w-screen flex-col overflow-hidden p-[2.2vw]">
      {/* כותרת + שעון */}
      <header className="flex items-start justify-between border-b border-[var(--board-line)] pb-[1.4vh]">
        <div>
          <div className="text-[clamp(1.4rem,3vw,3.4rem)] font-extrabold tracking-wide">
            לוח תורים · סימולטור A320
          </div>
          <div className="mt-[0.4vh] text-[clamp(0.9rem,1.5vw,1.6rem)] text-[var(--board-dim)]">
            {dateFmt.format(new Date())}
          </div>
        </div>
        <div className="flex items-center gap-[1.2vw]">
          <button
            onClick={toggleFs}
            className="rounded-xl bg-white/10 px-[1vw] py-[0.8vh] text-[clamp(0.8rem,1.3vw,1.3rem)] font-semibold ring-1 ring-white/15 hover:bg-white/20"
          >
            {isFs ? "יציאה ממסך מלא" : "מסך מלא"}
          </button>
          <div className="font-mono text-[clamp(2rem,5.4vw,6rem)] tabular-nums leading-none" suppressHydrationWarning>
            {clock}
          </div>
        </div>
      </header>

      {cycles.length === 0 || !cycle ? (
        <div className="grid flex-1 place-items-center text-[clamp(1.4rem,3vw,3rem)] text-[var(--board-dim)]">
          אין מחזורים מתוכננים
        </div>
      ) : (
        <>
          {/* ניווט בין מחזורים */}
          <nav className="flex items-center justify-between gap-[1.5vw] py-[1.6vh]">
            <button onClick={() => nav(-1)} className={navBtn} aria-label="המחזור הקודם">
              › הקודם
            </button>
            <div className="min-w-0 text-center">
              <div className="truncate text-[clamp(1.4rem,3.4vw,3.6rem)] font-extrabold">{cycle.name}</div>
              <div className="mt-[0.3vh] text-[clamp(0.9rem,1.6vw,1.7rem)] text-[var(--board-dim)]">
                {dateFmt.format(new Date(cycle.eventDate + "T12:00:00"))}
                <span className="mx-[0.8vw] opacity-40">·</span>
                מחזור {safeIdx + 1} מתוך {cycles.length}
              </div>
            </div>
            <div className="flex items-center gap-[0.8vw]">
              {safeIdx !== live ? (
                <button
                  onClick={goLive}
                  className="rounded-2xl bg-[var(--board-green)]/20 px-[1.4vw] py-[1vh] text-[clamp(0.9rem,1.7vw,1.7rem)] font-bold text-[var(--board-green)] ring-1 ring-[var(--board-green)]/30 hover:bg-[var(--board-green)]/30"
                >
                  עכשיו
                </button>
              ) : null}
              <button onClick={() => nav(1)} className={navBtn} aria-label="המחזור הבא">
                הבא ‹
              </button>
            </div>
          </nav>

          {/* פאנל "עכשיו" */}
          {hero ? (
            <section
              className={`rounded-[1.4vw] bg-[var(--board-panel)] px-[2.4vw] py-[2.2vh] ${heroFlip ? "board-flip" : ""}`}
              style={{ transformOrigin: "top center" }}
            >
              <div className="flex flex-wrap items-baseline gap-x-[2vw] gap-y-[0.6vh]">
                <span className="text-[clamp(1.2rem,2.6vw,2.8rem)] font-bold text-[var(--board-amber)]">
                  {TERM[hero.kind]}
                </span>
                <span className="font-mono text-[clamp(2.4rem,6.4vw,7rem)] tabular-nums leading-none">
                  {timeFmt.format(new Date(hero.startsAt))}
                  <span className="text-[var(--board-dim)]">–{timeFmt.format(new Date(hero.endsAt))}</span>
                </span>
                <span className={`text-[clamp(1.1rem,2.6vw,2.8rem)] font-bold ${statusOf(hero, now).cls}`}>
                  {statusOf(hero, now).label}
                </span>
              </div>
              {hero.label ? (
                <div className="mt-[0.6vh] text-[clamp(1rem,2vw,2rem)] text-[var(--board-dim)]">{hero.label}</div>
              ) : null}
              <div className="mt-[1.4vh] flex flex-wrap gap-[0.8vw]">
                {hero.names.length === 0 ? (
                  <span className="text-[clamp(1rem,2vw,2rem)] text-[var(--board-dim)]">— אין נרשמים —</span>
                ) : (
                  hero.names.map((n, i) => (
                    <span
                      key={i}
                      className="rounded-[0.8vw] bg-black/30 px-[1.2vw] py-[0.8vh] text-[clamp(1rem,2.2vw,2.3rem)] font-semibold"
                    >
                      {n}
                    </span>
                  ))
                )}
              </div>
            </section>
          ) : null}

          {/* רשימת החלונות של המחזור */}
          <div className="mt-[1.6vh] flex-1 overflow-hidden">
            <div className="grid grid-cols-[10ch_9ch_1fr_16ch] gap-x-[1.4vw] border-b border-[var(--board-line)] pb-[0.8vh] text-[clamp(0.8rem,1.4vw,1.4rem)] font-bold text-[var(--board-dim)]">
              <div>שעה</div>
              <div>סוג</div>
              <div>משתתפים</div>
              <div className="text-left">סטטוס</div>
            </div>
            <ul>
              {cycle.slots.map((s) => {
                const st = statusOf(s, now);
                return (
                  <li
                    key={s.slotId}
                    className={`board-row grid grid-cols-[10ch_9ch_1fr_16ch] items-center gap-x-[1.4vw] py-[1.15vh] text-[clamp(1rem,2.1vw,2.2rem)] ${
                      st.key === "done" ? "opacity-45" : ""
                    }`}
                  >
                    <div className="font-mono tabular-nums">{timeFmt.format(new Date(s.startsAt))}</div>
                    <div className="font-semibold text-[var(--board-amber)]">{TERM[s.kind]}</div>
                    <div className="truncate">
                      {s.names.length ? s.names.join(" · ") : "—"}
                      <span className="mr-[0.6vw] text-[clamp(0.75rem,1.3vw,1.25rem)] text-[var(--board-dim)]">
                        ({s.names.length}/{s.capacity})
                      </span>
                    </div>
                    <div className={`text-left font-bold ${st.cls}`}>{st.label}</div>
                  </li>
                );
              })}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
