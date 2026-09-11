"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { ActionResponse } from "@/types";

export default async function login(
  _prevState: ActionResponse<Record<string, unknown>>,
  formData: FormData,
): Promise<ActionResponse<Record<string, unknown>>> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  try {
    const res = await fetch(`${process.env.API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!data.success) {
      return {
        success: false,
        data: {},
        error: data.error ?? "Invalid email or password",
      };
    }

    // Express sets a signed, httpOnly cookie. getSetCookie() returns the raw
    // header strings — extract just the bare value ("s:uuid.signature") and
    // re-emit it on OUR domain so the browser now owns the session here.
    const header = res.headers
      .getSetCookie()
      .find((c) => c.startsWith("userId="));

    if (!header) {
      return { success: false, data: {}, error: "Authentication failed" };
    }

    const userIdValue = header.split(";")[0].split("=")[1];

    const cookieStore = await cookies();
    cookieStore.set("userId", userIdValue, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // seconds (Express used milliseconds)
    });
  } catch {
    return {
      success: false,
      data: {},
      error: "Failed to reach the API",
    };
  }

  // Outside the try — redirect() throws NEXT_REDIRECT, which must propagate.
  redirect("/projects");
}
