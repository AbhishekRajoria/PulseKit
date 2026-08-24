"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function login() {
  const cookieStore = await cookies();
  cookieStore.set("session", "test");
  console.log(cookieStore.get("session"));

  redirect("/events");
}
