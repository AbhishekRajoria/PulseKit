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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;

  const res = await fetch(`${process.env.API_URL}/api/events/${id}`);
  const data = await res.json();

  if (!res.ok) {
    return Response.json(data, { status: res.status });
  }

  if (data.data) {
    data.data = mapEvent(data.data);
  }

  return Response.json(data, { status: 200 });
}
