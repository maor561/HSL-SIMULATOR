import { notFound } from "next/navigation";
import { adminGetCycle } from "@/lib/queries";
import { todayInIsrael } from "@/lib/time";
import { RunConsole, type RunSlot } from "./RunConsole";

export const dynamic = "force-dynamic";
export const metadata = { title: "מצב הפעלה · A320 SIM" };

export default async function RunPage({
  params,
}: {
  params: Promise<{ cycleId: string }>;
}) {
  const { cycleId } = await params;
  const data = await adminGetCycle(cycleId);
  if (!data) notFound();

  const slots: RunSlot[] = data.slots.map((s) => ({
    id: s.id,
    kind: s.kind,
    label: s.label,
    startsAt: s.startsAt.toISOString(),
    endsAt: s.endsAt.toISOString(),
    capacity: s.capacity,
    taken: s.taken,
    names: s.names,
    actualStartAt: s.actualStartAt?.toISOString() ?? null,
    actualEndAt: s.actualEndAt?.toISOString() ?? null,
  }));

  return (
    <RunConsole
      cycleId={data.cycle.id}
      cycleName={data.cycle.name}
      eventDate={data.cycle.eventDate}
      isToday={data.cycle.eventDate === todayInIsrael()}
      slots={slots}
    />
  );
}
