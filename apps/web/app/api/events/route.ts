export async function GET(): Promise<Response> {
  const res = await fetch(`${process.env.API_URL}/api/v1/events`, {
    headers: { Authorization: `Bearer ${process.env.API_KEY}` },
  });
  const data = await res.json();

  return Response.json(data, { status: res.status });
}
