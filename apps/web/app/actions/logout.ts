"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function logout(_formData: FormData): Promise<void> {
  void _formData;
  try {
    await fetch(`${process.env.API_URL}/auth/logout`, { method: "POST" });
  } catch {
    // Fall through — clearing the local cookie still ends the session.
  }

  const cookieStore = await cookies();
  cookieStore.delete("userId");

  redirect("/login");
}