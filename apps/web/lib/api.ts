import { cookies } from "next/headers";

export async function fetchApi(path: string, init?: RequestInit) {
  const cookieStore = await cookies();
  const cookie = cookieStore.get("userId")?.value;

  return fetch(`${process.env.API_URL}${path}`, {
    ...init,
    headers: {
      ...init?.headers,
      ...(cookie ? { Cookie: `userId=${cookie}` } : {}),
    },
  });
}