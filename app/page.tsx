import { getPublishedCycles, type SlotWithCount } from "@/lib/queries";
import { RegisterBoard, type RSlot } from "@/components/RegisterBoard";

export const dynamic = "force-dynamic";

function toRSlot(s: SlotWithCount): RSlot {
  return {
    id: s.id,
    kind: s.kind,
    label: s.label,
    startsAt: s.startsAt.toISOString(),
    endsAt: s.endsAt.toISOString(),
    capacity: s.capacity,
    isOpen: s.isOpen,
    taken: s.taken,
  };
}

export default async function HomePage() {
  const raw = await getPublishedCycles();
  const cycles = raw.map(({ cycle, briefings, sims }) => ({
    id: cycle.id,
    name: cycle.name,
    eventDate: cycle.eventDate,
    briefings: briefings.map(toRSlot),
    sims: sims.map(toRSlot),
  }));

  return <RegisterBoard cycles={cycles} />;
}
