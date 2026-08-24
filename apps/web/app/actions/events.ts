"use server";

import { type EventForm } from "../components/SendEventForm";

type ActionResponse<T> = {
  data: T | Record<string, unknown>;
  success?: boolean;
  error?: string;
};

export async function submitForm(
  formData: FormData,
): Promise<ActionResponse<EventForm>> {
  const data: EventForm | Record<string, unknown> = {
    eventName: formData.get("eventName") ?? "",
    userId: formData.get("userId"),
    payload: formData.get("payload"),
  };

  return {
    data: {
      userId: data.userId,
      eventName: data.eventName,
    },
    success: true,
  };
}
