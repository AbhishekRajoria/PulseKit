"use server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function createProject(
  _prevState: { error?: string; success?: boolean; apiKey?: string; projectId?: string },
  formData: FormData,
): Promise<{ error?: string; success?: boolean; apiKey?: string; projectId?: string }> {
  const name = formData.get("name") as string;

  if (!name) {
    return { error: "Project name is required" };
  }

  const cookieStore = await cookies();
  const cookie = cookieStore.get("userId")?.value;

  const res = await fetch(`${process.env.API_URL}/api/v1/projects`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: `userId=${cookie}` } : {}),
    },
    body: JSON.stringify({ name }),
  });

  const data = await res.json();

  if (!data.success) {
    return { error: data.error ?? "Failed to create project" };
  }

  revalidatePath("/projects");
  return {
    success: true,
    apiKey: data.data.api_key as string,
    projectId: data.data.id as string,
  };
}

export async function revealApiKey(
  projectId: string,
  _prevState: { error?: string; apiKey?: string },
  formData: FormData,
): Promise<{ error?: string; apiKey?: string }> {
  const password = formData.get("password") as string;

  if (!password) {
    return { error: "Password is required to reveal the API key" };
  }

  const cookieStore = await cookies();
  const cookie = cookieStore.get("userId")?.value;

  const res = await fetch(`${process.env.API_URL}/api/v1/projects/${projectId}/reveal-key`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: `userId=${cookie}` } : {}),
    },
    body: JSON.stringify({ password }),
  });

  const data = await res.json();

  if (!data.success) {
    return { error: data.error ?? "Failed to reveal API key" };
  }

  return { apiKey: data.data.api_key as string };
}