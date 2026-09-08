export async function PATCH(req: Request) {
  const body = await req.json();
  const res = await fetch(
    `${process.env.API_URL}/api/v1/notifications/read-all`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${process.env.API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );
  const data = await res.json();

  return Response.json(data, { status: res.status });
}
