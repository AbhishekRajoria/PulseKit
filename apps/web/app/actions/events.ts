"use server";

type ActionResponse<T> = {
  data: T | Record<string, unknown>;
  success: boolean;
  error?: string;
};

export async function submitForm(
  formData: FormData,
): Promise<ActionResponse<Record<string, unknown>>> {
  const event = formData.get("event") as string;
  const userId = formData.get("userId") as string;
  const channel = formData.get("channel") as string;
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

  const res = await fetch(`${process.env.API_URL}/api/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event, userId, channel, payload }),
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
