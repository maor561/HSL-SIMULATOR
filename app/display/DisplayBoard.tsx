"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type FeedSlot = {
  slotId: string;
  kind: "briefing" | "sim";
  label: string | null;
  startsAt: string;
  endsAt: string;
  capacity: number;
  actualStartAt: string | null;
  actualEndAt: string | null;
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
const t2 = (o: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("he-IL", { timeZone: TZ, hour12: false, ...o });
const timeFmt = t2({ hour: "2-digit", minute: "2-digit" });
const clockFmt = t2({ hour: "2-digit", minute: "2-digit", second: "2-digit" });
const dateFmt = t2({ weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" });

const TERM = { briefing: "תדריך", sim: "טיסה" } as const;

type Status = { key: "done" | "now" | "boarding" | "soon"; label: string; cls: string };
function statusOf(s: FeedSlot, now: number): Status {
  // כשהחלון פעיל/קרוב — הסטטוס הוא סוג החלון עצמו
  const activeLabel = s.kind === "briefing" ? "תדריך" : "בטיסה";
  if (s.actualEndAt) return { key: "done", label: "הסתיים", cls: "text-[var(--board-dim)]" };
  if (s.actualStartAt)
    return { key: "now", label: activeLabel, cls: "text-[var(--board-green)] board-blink" };
  const start = new Date(s.startsAt).getTime();
  const end = new Date(s.endsAt).getTime();
  if (now >= end) return { key: "done", label: "הסתיים", cls: "text-[var(--board-dim)]" };
  if (now >= start)
    return { key: "now", label: activeLabel, cls: "text-[var(--board-green)] board-blink" };
  const mins = Math.ceil((start - now) / 60_000);
  if (mins <= 15) return { key: "boarding", label: activeLabel, cls: "text-[var(--board-amber)]" };
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

function slotOpen(s: FeedSlot, now: number): boolean {
  if (s.actualEndAt) return false;
  if (s.actualStartAt) return true;
  return new Date(s.endsAt).getTime() >= now;
}

function liveCycleIndex(cycles: FeedCycle[], now: number): number {
  const i = cycles.findIndex((c) => c.slots.some((s) => slotOpen(s, now)));
  return i >= 0 ? i : Math.max(0, cycles.length - 1);
}

const IDLE_MS = 45_000;

/** גלילת "רצועת חדשות" רציפה — הטקסט זורם, מסתיים, ומתחיל מחדש. */
const MARQUEE_PX_PER_SEC = 24; // מהירות רצועה איטית (רצועת חדשות)
const MARQUEE_GAP = 72; // רווח בין סוף הטקסט להתחלה החוזרת

function Marquee({
  children,
  dep,
  className = "",
}: {
  children: React.ReactNode;
  dep: string;
  className?: string;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const first = useRef<HTMLSpanElement>(null);
  const second = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const w = wrap.current;
    const tr = track.current;
    const f = first.current;
    const s = second.current;
    if (!w || !tr || !f || !s) return;
    let anim: Animation | undefined;
    const setup = () => {
      anim?.cancel();
      tr.style.transform = "translateX(0)";
      // scrollWidth/clientWidth הם ב-px של הפריסה — לא מושפעים מה-scale של הקנבס
      const fw = f.scrollWidth;
      const need = fw > w.clientWidth + 4;
      s.style.display = need ? "flex" : "none";
      if (!need) return;
      if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
      const shift = fw + MARQUEE_GAP;
      // RTL: הטקסט זורם ימינה, יוצא מימין ונכנס מחדש משמאל
      anim = tr.animate(
        [{ transform: "translateX(0)" }, { transform: `translateX(${shift}px)` }],
        { duration: (shift / MARQUEE_PX_PER_SEC) * 1000, iterations: Infinity, easing: "linear" },
      );
    };
    setup();
    const ro = new ResizeObserver(setup);
    ro.observe(w);
    return () => {
      ro.disconnect();
      anim?.cancel();
    };
  }, [dep]);

  return (
    <div ref={wrap} className={`overflow-hidden ${className}`}>
      <div ref={track} className="flex w-max whitespace-nowrap will-change-transform">
        <span ref={first} className="flex shrink-0 items-center gap-3">
          {children}
        </span>
        <span
          ref={second}
          aria-hidden
          className="shrink-0 items-center gap-3"
          style={{ display: "none", marginInlineStart: MARQUEE_GAP }}
        >
          {children}
        </span>
      </div>
    </div>
  );
}

export function DisplayBoard({ initial }: { initial: Feed }) {
  const [feed, setFeed] = useState<Feed>(initial);
  const [now, setNow] = useState(() => Date.now());
  const [clock, setClock] = useState("");
  const [idx, setIdx] = useState(() => liveCycleIndex(initial.cycles, Date.now()));
  const [isFs, setIsFs] = useState(false);
  const [scale, setScale] = useState(1);
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

  // התאמת קנבס קבוע 1920x1080 לכל מסך (טלוויזיה / לפטופ / זום)
  useEffect(() => {
    const fit = () =>
      setScale(Math.min(window.innerWidth / 1920, window.innerHeight / 1080) || 1);
    fit();
    const raf = requestAnimationFrame(fit);
    window.addEventListener("resize", fit);
    window.addEventListener("orientationchange", fit);
    window.visualViewport?.addEventListener("resize", fit);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", fit);
      window.removeEventListener("orientationchange", fit);
      window.visualViewport?.removeEventListener("resize", fit);
    };
  }, []);

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
    const running = cycle.slots.find((s) => s.actualStartAt && !s.actualEndAt);
    if (running) return running;
    const liveSlot = cycle.slots.find((s) => {
      const st = new Date(s.startsAt).getTime();
      const en = new Date(s.endsAt).getTime();
      return !s.actualEndAt && now >= st && now < en;
    });
    const next = cycle.slots.find((s) => slotOpen(s, now));
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
    "select-none rounded-2xl bg-white/10 px-9 py-4 text-[30px] font-bold ring-1 ring-white/15 hover:bg-white/20 active:bg-white/25";

  return (
    <div className="board fixed inset-0 overflow-hidden">
      {/* קנבס קבוע 1920x1080, מוקטן/מוגדל להתאמה מדויקת לכל מסך (טלוויזיה / לפטופ / זום) */}
      <div
        style={{
          width: 1920,
          height: 1080,
          position: "absolute",
          left: `calc(50% - ${960 * scale}px)`,
          top: `calc(50% - ${540 * scale}px)`,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
        className="board flex flex-col p-10"
      >
        {/* כותרת + שעון */}
        <header className="flex items-start justify-between border-b-2 border-[var(--board-line)] pb-4">
          <div>
            <div className="text-[42px] font-extrabold tracking-wide">לוח טיסות · סימולטור A320</div>
            <div className="mt-1 text-[22px] text-[var(--board-dim)]">{dateFmt.format(new Date())}</div>
          </div>
          <div className="flex items-center gap-6">
            <button
              onClick={toggleFs}
              className="rounded-xl bg-white/10 px-5 py-2.5 text-[19px] font-semibold ring-1 ring-white/15 hover:bg-white/20"
            >
              {isFs ? "יציאה ממסך מלא" : "מסך מלא"}
            </button>
            <div className="font-mono text-[84px] leading-none tabular-nums" suppressHydrationWarning>
              {clock}
            </div>
          </div>
        </header>

        {cycles.length === 0 || !cycle ? (
          <div className="grid flex-1 place-items-center text-[44px] text-[var(--board-dim)]">
            אין מחזורים מתוכננים
          </div>
        ) : (
          <>
            {/* ניווט בין מחזורים */}
            <nav className="flex items-center justify-between gap-8 py-5">
              <button onClick={() => nav(-1)} className={navBtn} aria-label="המחזור הקודם">
                › הקודם
              </button>
              <div className="min-w-0 flex-1 text-center">
                <div className="truncate text-[48px] font-extrabold leading-tight">{cycle.name}</div>
                <div className="mt-1 text-[22px] text-[var(--board-dim)]">
                  {dateFmt.format(new Date(cycle.eventDate + "T12:00:00"))}
                  <span className="mx-3 opacity-40">·</span>
                  מחזור {safeIdx + 1} מתוך {cycles.length}
                </div>
              </div>
              <div className="flex items-center gap-4">
                {safeIdx !== live ? (
                  <button
                    onClick={goLive}
                    className="rounded-2xl bg-[var(--board-green)]/20 px-7 py-3.5 text-[24px] font-bold text-[var(--board-green)] ring-1 ring-[var(--board-green)]/30 hover:bg-[var(--board-green)]/30"
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
                className={`rounded-3xl bg-[var(--board-panel)] px-10 py-6 ${heroFlip ? "board-flip" : ""}`}
                style={{ transformOrigin: "top center" }}
              >
                <div className="flex flex-wrap items-baseline gap-x-9 gap-y-1">
                  <span className="text-[38px] font-bold text-[var(--board-amber)]">{TERM[hero.kind]}</span>
                  <span className="font-mono text-[88px] leading-none tabular-nums">
                    {timeFmt.format(new Date(hero.startsAt))}
                    <span className="text-[var(--board-dim)]">–{timeFmt.format(new Date(hero.endsAt))}</span>
                  </span>
                  <span className={`text-[38px] font-bold ${statusOf(hero, now).cls}`}>
                    {statusOf(hero, now).label}
                  </span>
                </div>
                {hero.label ? (
                  <div className="mt-1 text-[26px] text-[var(--board-dim)]">{hero.label}</div>
                ) : null}
                {hero.names.length === 0 ? (
                  <div className="mt-4 text-[26px] text-[var(--board-dim)]">— אין נרשמים —</div>
                ) : (
                  <Marquee className="mt-4" dep={hero.slotId + hero.names.join("|")}>
                    {hero.names.map((n, i) => (
                      <span
                        key={i}
                        className="rounded-xl bg-black/30 px-6 py-2 text-[30px] font-semibold"
                      >
                        {n}
                      </span>
                    ))}
                  </Marquee>
                )}
              </section>
            ) : null}

            {/* רשימת החלונות של המחזור */}
            <div className="mt-4 flex-1 overflow-hidden">
              <div className="grid grid-cols-[11ch_9ch_1fr_15ch] gap-x-8 border-b-2 border-[var(--board-line)] pb-2 text-[21px] font-bold text-[var(--board-dim)]">
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
                      className={`board-row grid grid-cols-[11ch_9ch_1fr_15ch] items-center gap-x-8 py-3 text-[32px] ${
                        st.key === "done" ? "opacity-45" : ""
                      }`}
                    >
                      <div className="font-mono tabular-nums">{timeFmt.format(new Date(s.startsAt))}</div>
                      <div className="font-semibold text-[var(--board-amber)]">{TERM[s.kind]}</div>
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="shrink-0 text-[22px] text-[var(--board-dim)]">
                          ({s.names.length}/{s.capacity})
                        </span>
                        <Marquee className="min-w-0 flex-1" dep={s.names.join("|")}>
                          {s.names.length ? s.names.join("  ·  ") : "—"}
                        </Marquee>
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
    </div>
  );
}
