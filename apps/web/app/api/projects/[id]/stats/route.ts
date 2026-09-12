import { cookies } from "next/headers";

export async function GET(
  _req: Request,
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

  const res = await fetch(`${process.env.API_URL}/api/v1/projects/${id}/stats`, {
    headers: {
      Cookie: `userId=${userId}`,
    },
  });
  const data = await res.json();

  return Response.json(data, { status: res.status });
}
