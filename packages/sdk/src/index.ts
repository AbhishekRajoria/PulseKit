const DEFAULT_BASE_URL = "https://pulsekit-api.up.railway.app/api/v1";
const DEFAULT_TIMEOUT = 10_000;

export type PulseKitOptions = {
  apiKey: string; // required — what identifies the caller to the server
  baseUrl?: string; // optional — where to hit (default the hosted API)
  timeout?: number; // optional — ms before giving up (default 10_000)
};

export type PulseKitEvent = {
  event: string; // what happened, e.g. 'payment.failed'
  user: string; // WHICH end-user in YOUR app this is about
  data?: Record<string, unknown>; // any extra info
  to?: string; // per-event email recipient override
  userName?: string; // friendly name for the email greeting
};

export type EventReceipt = {
  eventId: string; // server's uuid for this event
  receivedAt: string; // ISO timestamp when server accepted it
};

export class PulseKitError extends Error {
  name = "PulseKitError";

  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly body: unknown,
  ) {
    super(message);
  }
}

export class PulseKit {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeout: number;

  constructor(options: PulseKitOptions) {
    if (!options.apiKey) {
      throw new PulseKitError("apiKey is required", 400, null);
    }

    this.apiKey = options.apiKey;
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
    this.timeout = options.timeout ?? DEFAULT_TIMEOUT;
  }

  async notify(input: PulseKitEvent): Promise<EventReceipt | null> {
    if (!input.event) {
      throw new PulseKitError("event is required", 400, null);
    }
    if (!input.user) {
      throw new PulseKitError("user is required", 400, null);
    }

    const controller = new AbortController();

    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const res = await fetch(`${this.baseUrl}/events`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          event_name: input.event,
          user_id: input.user,
          payload: input.data ?? {},
          ...(input.to ? { to: input.to } : {}),
          ...(input.userName ? { user_name: input.userName } : {}),
        }),
        signal: controller.signal,
      });

      const body = await res.json().catch(() => null);

      if (res.ok) {
        if (body?.data?.eventId) {
          return {
            eventId: body.data.eventId,
            receivedAt: body.data.receivedAt,
          };
        }
        return null;
      }

      // 4xx (not 429) = caller's contract violation → throw
      if (res.status >= 400 && res.status < 500 && res.status !== 429) {
        const message =
          body?.error ?? `PulseKit request failed with status ${res.status}`;
        throw new PulseKitError(message, res.status, body);
      }

      // 5xx / 429 = transient → warn + return null
      if (process.env.NODE_ENV !== "production") {
        console.warn(
          `[pulsekit] event not ingested (${res.status}). Delivery will not occur.`,
        );
      }
      return null;
    } catch (error) {
      if (error instanceof PulseKitError) throw error; // ← re-throw our own errors
      const isTimeout = error instanceof Error && error.name === "AbortError"; // ← ===, not ==
      if (process.env.NODE_ENV !== "production") {
        console.warn(
          `[pulsekit] request failed: ${isTimeout ? "timeout" : error instanceof Error ? error.message : "unknown error"}`,
        );
      }
      return null; // ← explicitly return null
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
