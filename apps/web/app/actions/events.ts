"use server";

type ActionResponse<T> = {
  data: T | Record<string, unknown>;
  success: boolean;
  error?: string;
};

export async function submitForm(
  formData: FormData,
): Promise<ActionResponse<Record<string, unknown>>> {
  const eventName = formData.get("eventName") as string;
  const userId = formData.get("userId") as string;
  const payloadRaw = formData.get("payload") as string;

  let payload: Record<string, unknown> | undefined;
  if (payloadRaw) {
    try {
      payload = JSON.parse(payloadRaw);
    } catch {
      return {
        data: {},
        success: false,
        error: "Invalid JSON in payload",
      };
    }
  }

  const res = await fetch(`${process.env.API_URL}/api/v1/events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.API_KEY}`,
    },
    body: JSON.stringify({ event_name: eventName, user_id: userId, payload }),
  });

  const data = await res.json();

  if (!data.success) {
    return {
      data: {},
      success: false,
      error: data.error || "Failed to send event",
    };
  }

  return {
    data: data.data,
    success: true,
  };
}
