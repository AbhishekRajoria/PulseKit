import { events } from "./events";

export async function GET(): Promise<Response> {
  return Response.json({
    success: true,
    data: events,
  });
}
