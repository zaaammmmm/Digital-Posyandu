import { NextRequest } from "next/server";
import { reviewServiceEvent } from "@/lib/data/service-event-review";

export async function POST(req: NextRequest, context: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await context.params;
  return reviewServiceEvent(req, eventId, "supplement_events");
}
