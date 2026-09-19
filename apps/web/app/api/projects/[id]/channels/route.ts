import { cookies } from "next/headers";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;

  if (!userId) {
    return Response.json(
      { success: false, error: "Unauthenticated" },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const res = await fetch(
    `${process.env.API_URL}/api/v1/projects/${id}/channels`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: `userId=${userId}`,
      },
      body: JSON.stringify(body),
    },
  );
  const data = await res.json();

  return Response.json(data, { status: res.status });
}