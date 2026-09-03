"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Item = {
  slotId: string;
  kind: "briefing" | "sim";
  label: string | null;
  cycleName: string;
  startsAt: string;
  endsAt: string;
  capacity: number;
  names: string[];
};

type Feed = { now: string; items: Item[] };

const TZ = "Asia/Jerusalem";
const timeFmt = new Intl.DateTimeFormat("he-IL", {
  timeZone: TZ,
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});
const clockFmt = new Intl.DateTimeFormat("he-IL", {
  timeZone: TZ,
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});
const dateFmt = new Intl.DateTimeFormat("he-IL", {
  timeZone: TZ,
  weekday: "long",
  day: "2-digit",
  month: "2-digit",
});

const BOARD_TERM = { briefing: "תדריך", sim: "טיסה" } as const;

function statusOf(item: Item, now: number) {
  const start = new Date(item.startsAt).getTime();
  const end = new Date(item.endsAt).getTime();
  if (now >= end) return { key: "done", label: "הסתיים", cls: "text-[var(--board-dim)]" };
  if (now >= start)
    return { key: "now", label: "עכשיו", cls: "text-[var(--board-green)] board-blink" };
  if (start - now <= 15 * 60_000)
    return { key: "boarding", label: "התייצבות", cls: "text-[var(--board-amber)]" };
  return { key: "soon", label: "בהמשך", cls: "text-[var(--board-text)]" };
}

export function DisplayBoard({ initial }: { initial: Feed }) {
  const [feed, setFeed] = useState<Feed>(initial);
  const [now, setNow] = useState(() => Date.now());
  const [clock, setClock] = useState("");
  const heroKeyRef = useRef<string>("");
  const [heroFlip, setHeroFlip] = useState(false);

  useEffect(() => {
    const tick = () => {
      setNow(Date.now());
      setClock(clockFmt.format(new Date()));
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let alive = true;
    const pull = async () => {
      try {
        const r = await fetch("/api/display", { cache: "no-store" });
        if (!r.ok) return;
        const data = (await r.json()) as Feed;
        if (alive) setFeed(data);
      } catch {
        /* מתעלמים משגיאת רשת רגעית */
      }
    };
    const t = setInterval(pull, 15_000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  const visible = useMemo(
    () => feed.items.filter((i) => new Date(i.endsAt).getTime() >= now - 5 * 60_000),
    [feed.items, now],
  );

  const hero = useMemo(() => {
    const live = visible.find((i) => {
      const s = new Date(i.startsAt).getTime();
      const e = new Date(i.endsAt).getTime();
      return now >= s && now < e;
    });
    return live ?? visible[0] ?? null;
  }, [visible, now]);

  useEffect(() => {
    const k = hero?.slotId ?? "none";
    if (heroKeyRef.current && heroKeyRef.current !== k) {
      setHeroFlip(true);
      const t = setTimeout(() => setHeroFlip(false), 500);
      return () => clearTimeout(t);
    }
    heroKeyRef.current = k;
  }, [hero?.slotId]);

  return (
    <div className="board min-h-screen px-6 py-5 md:px-12 md:py-8">
      <header className="flex items-end justify-between border-b border-[var(--board-line)] pb-4">
        <div>
          <div className="text-2xl font-bold tracking-wide md:text-4xl">לוח תורים · סימולטור</div>
          <div className="mt-1 text-sm text-[var(--board-dim)] md:text-lg">
            {dateFmt.format(new Date())}
          </div>
        </div>
        <div
          className="font-mono text-3xl tabular-nums md:text-6xl"
          suppressHydrationWarning
        >
          {clock}
        </div>
      </header>

      {hero ? (
        <section
          className={`mt-6 rounded-2xl bg-[var(--board-panel)] p-6 md:p-10 ${
            heroFlip ? "board-flip" : ""
          }`}
          style={{ transformOrigin: "top center" }}
        >
          <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
            <span className="text-xl font-semibold text-[var(--board-amber)] md:text-3xl">
              {BOARD_TERM[hero.kind]}
            </span>
            <span className="font-mono text-4xl tabular-nums md:text-7xl">
              {timeFmt.format(new Date(hero.startsAt))}
            </span>
            <span className={`text-xl md:text-3xl ${statusOf(hero, now).cls}`}>
              {statusOf(hero, now).label}
            </span>
          </div>
          <div className="mt-2 text-lg text-[var(--board-dim)] md:text-2xl">
            {hero.cycleName}
            {hero.label ? ` · ${hero.label}` : ""}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {hero.names.length === 0 ? (
              <span className="text-[var(--board-dim)]">—</span>
            ) : (
              hero.names.map((n, i) => (
                <span
                  key={i}
                  className="rounded-lg bg-black/30 px-3 py-1.5 text-lg md:text-2xl"
                >
                  {n}
                </span>
              ))
            )}
          </div>
        </section>
      ) : (
        <div className="mt-20 text-center text-2xl text-[var(--board-dim)]">
          אין תורים מתוכננים כרגע
        </div>
      )}

      {visible.length > 1 ? (
        <section className="mt-8">
          <div className="grid grid-cols-[auto_7rem_1fr_9rem] gap-x-4 border-b border-[var(--board-line)] pb-2 text-sm font-semibold text-[var(--board-dim)] md:text-lg">
            <div>שעה</div>
            <div>סוג</div>
            <div>משתתפים</div>
            <div className="text-left">סטטוס</div>
          </div>
          <ul>
            {visible.map((item) => {
              const st = statusOf(item, now);
              return (
                <li
                  key={item.slotId}
                  className="board-row grid grid-cols-[auto_7rem_1fr_9rem] items-center gap-x-4 py-3 text-lg md:text-2xl"
                >
                  <div className="font-mono tabular-nums">
                    {timeFmt.format(new Date(item.startsAt))}
                  </div>
                  <div className="text-[var(--board-amber)]">{BOARD_TERM[item.kind]}</div>
                  <div className="truncate text-[var(--board-text)]">
                    {item.names.length ? item.names.join(" · ") : "—"}
                    <span className="mr-2 text-sm text-[var(--board-dim)]">
                      ({item.names.length}/{item.capacity})
                    </span>
                  </div>
                  <div className={`text-left font-semibold ${st.cls}`}>{st.label}</div>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
