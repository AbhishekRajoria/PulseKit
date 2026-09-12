import { cookies } from "next/headers";

export async function GET(): Promise<Response> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get("userId")?.value;

  const res = await fetch(`${process.env.API_URL}/api/v1/projects`, {
    headers: cookie ? { Cookie: `userId=${cookie}` } : {},
  });
  const data = await res.json();

  return Response.json(data, { status: res.status });
}