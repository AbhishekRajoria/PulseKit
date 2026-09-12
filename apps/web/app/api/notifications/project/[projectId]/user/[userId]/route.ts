import { cookies } from "next/headers";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ projectId: string; userId: string }> },
) {
  const { projectId, userId } = await params;
  const cookieStore = await cookies();
  const cookieUserId = cookieStore.get("userId")?.value;

  if (!cookieUserId) {
    return Response.json(
      { success: false, error: "Unauthenticated" },
      { status: 401 },
    );
  }

  const res = await fetch(
    `${process.env.API_URL}/api/v1/notifications/project/${projectId}/user/${userId}`,
    {
      headers: {
        Cookie: `userId=${cookieUserId}`,
      },
    },
  );
  const data = await res.json();

  return Response.json(data, { status: res.status });
}
