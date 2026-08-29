export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;

  const res = await fetch(`${process.env.API_URL}/api/v1/events/${id}`, {
    headers: { Authorization: `Bearer ${process.env.API_KEY}` },
  });
  const data = await res.json();


  return Response.json(data, { status: res.status });
}
