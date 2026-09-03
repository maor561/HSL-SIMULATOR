import { NextResponse } from "next/server";
import { getDisplayQueue } from "@/lib/queries";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const queue = await getDisplayQueue();
  const items = queue
    .map((s) => ({
      slotId: s.slotId,
      kind: s.kind,
      label: s.label,
      cycleName: s.cycleName,
      startsAt: s.startsAt.toISOString(),
      endsAt: s.endsAt.toISOString(),
      capacity: s.capacity,
      names: s.names,
    }))
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));

  return NextResponse.json(
    { now: new Date().toISOString(), items },
    { headers: { "cache-control": "no-store" } },
  );
}
