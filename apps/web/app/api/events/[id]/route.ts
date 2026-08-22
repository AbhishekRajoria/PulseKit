import { events } from "../events";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;

  const result = events.find((event) => event.id === id);

  return result
    ? Response.json(
        {
          success: true,
          data: result,
        },
        {
          status: 200,
        },
      )
    : Response.json(
        {
          success: false,
          error: "Event not found",
        },
        {
          status: 404,
        },
      );
}
