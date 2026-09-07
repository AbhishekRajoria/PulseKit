export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const res = await fetch(
    `${process.env.API_URL}/api/v1/notifications/${id}/read`,
    { method: "PATCH", headers: { Authorization: `Bearer ${process.env.API_KEY}` } },
  );
  const data = await res.json();

  return Response.json(data, { status: res.status });
}
