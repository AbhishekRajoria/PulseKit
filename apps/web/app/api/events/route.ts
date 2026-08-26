import { Event } from "@/types";

function mapEvent(row: Record<string, unknown>): Event {
  return {
    id: row.id as string,
    event: row.event as string,
    user_id: row.user_id as string,
    payload: row.payload as Record<string, unknown> | undefined,
    status: row.status as Event["status"],
    channel: row.channel as Event["channel"],
    received_at: row.received_at as string,
  };
}

export async function GET(): Promise<Response> {
  const res = await fetch(`${process.env.API_URL}/api/events`);
  const data = await res.json();

  if (data.data) {
    data.data = data.data.map(mapEvent);
  }

  return Response.json(data);
}
