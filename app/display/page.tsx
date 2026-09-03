import { getDisplayQueue } from "@/lib/queries";
import { DisplayBoard } from "./DisplayBoard";

export const dynamic = "force-dynamic";
export const metadata = { title: "מסך הקרנה · תורים לסימולטור" };

export default async function DisplayPage() {
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

  return <DisplayBoard initial={{ now: new Date().toISOString(), items }} />;
}
