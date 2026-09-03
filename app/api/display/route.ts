import { NextResponse } from "next/server";
import { getDisplayCycles } from "@/lib/queries";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
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

  return NextResponse.json(
    { now: new Date().toISOString(), cycles },
    { headers: { "cache-control": "no-store" } },
  );
}
