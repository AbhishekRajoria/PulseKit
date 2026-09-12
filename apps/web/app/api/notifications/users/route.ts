import { cookies } from "next/headers";

export async function GET(req: Request) {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;

  if (!userId) {
    return Response.json(
      { success: false, error: "Unauthenticated" },
      { status: 401 },
    );
  }

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("project_id");

  if (!projectId) {
    return Response.json(
      { success: false, error: "Missing project_id" },
      { status: 400 },
    );
  }

  const res = await fetch(
    `${process.env.API_URL}/api/v1/notifications/users?project_id=${projectId}`,
    {
      headers: {
        Cookie: `userId=${userId}`,
      },
    },
  );
  const data = await res.json();

  return Response.json(data, { status: res.status });
}
