import { getDisplayCycles } from "@/lib/queries";
import { DisplayBoard, type Feed } from "./DisplayBoard";

export const dynamic = "force-dynamic";
export const metadata = { title: "מסך הקרנה · תורים לסימולטור" };

export default async function DisplayPage() {
  const cycles = (await getDisplayCycles()).map((c) => ({
    id: c.id,
    name: c.name,
    eventDate: c.eventDate,
    slots: c.slots
      .map((s) => ({
        slotId: s.slotId,
        kind: s.kind,
        label: s.label,
        startsAt: s.startsAt.toISOString(),
        endsAt: s.endsAt.toISOString(),
        capacity: s.capacity,
        actualStartAt: s.actualStartAt?.toISOString() ?? null,
        actualEndAt: s.actualEndAt?.toISOString() ?? null,
        names: s.names,
      }))
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
  }));

  const feed: Feed = { now: new Date().toISOString(), cycles };
  return <DisplayBoard initial={feed} />;
}
