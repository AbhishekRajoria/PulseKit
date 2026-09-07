export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = (await params).id;
  const res = await fetch(
    `${process.env.API_URL}/api/v1/notifications/${userId}`,
    { headers: { Authorization: `Bearer ${process.env.API_KEY}` } },
  );
  const data = await res.json();

  return Response.json(data, { status: res.status });
}
