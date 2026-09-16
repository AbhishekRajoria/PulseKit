import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { PulseKit, PulseKitError, PulseKitEvent, PulseKitOptions } from ".";

const makeClient = (overrides = {}) =>
  new PulseKit({ apiKey: "pk_test_123", ...overrides });

beforeEach(() => vi.stubGlobal("fetch", vi.fn()));

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

function mockResponse(body: object, status = 200) {
  return new Response(JSON.stringify(body), {
    status: status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("PulseKit constructor", () => {
  it("throws PulseKitError when apiKey is missing", () => {
    expect(() => new PulseKit({} as PulseKitOptions)).toThrow(PulseKitError);
  });

  it("appends /events to the default baseUrl", async () => {
    const pk = makeClient();
    vi.mocked(fetch).mockResolvedValue(
      mockResponse({ success: true, data: { eventId: "1", receivedAt: "ts" } }),
    );
    await pk.notify({ event: "payment.failed", user: "123" });
    expect(fetch).toHaveBeenCalledWith(
      "https://pulsekit-api.up.railway.app/api/v1/events",
      expect.anything(),
    );
  });

  it("strips trailing slashes from a custom baseUrl", async () => {
    const pk = makeClient({ baseUrl: "https://api.com/" });
    vi.mocked(fetch).mockResolvedValue(
      mockResponse({ success: true, data: { eventId: "1", receivedAt: "ts" } }),
    );
    await pk.notify({ event: "payment.failed", user: "123" });
    expect(fetch).toHaveBeenCalledWith(
      "https://api.com/events",
      expect.anything(),
    );
  });
});

describe("notify validation", () => {
  it("throws PulseKitError when event is missing", async () => {
    const pk = makeClient();

    await expect(pk.notify({ user: "123" } as PulseKitEvent)).rejects.toThrow(
      PulseKitError,
    );
  });

  it("throws PulseKitError when user is missing", async () => {
    const pk = makeClient();

    await expect(
      pk.notify({ event: "payment.failed" } as PulseKitEvent),
    ).rejects.toThrow(PulseKitError);
  });
});

describe("notify success", () => {
  it("returns EventReceipt with eventId and receivedAt", async () => {
    const pk = makeClient();

    vi.mocked(fetch).mockResolvedValue(
      mockResponse({ success: true, data: { eventId: "1", receivedAt: "ts" } }),
    );

    const res = await pk.notify({ event: "payment.failed", user: "123" });

    expect(fetch).toHaveBeenCalledWith(
      "https://pulsekit-api.up.railway.app/api/v1/events",
      expect.anything(),
    );

    expect(res).toEqual({ eventId: "1", receivedAt: "ts" });
  });

  it("sends correct headers (Bearer token, JSON content type)", async () => {
    const pk = makeClient();

    vi.mocked(fetch).mockResolvedValue(
      mockResponse({ success: true, data: { eventId: "1", receivedAt: "ts" } }),
    );

    await pk.notify({ event: "payment.failed", user: "123" });

    expect(fetch).toHaveBeenCalledWith(
      "https://pulsekit-api.up.railway.app/api/v1/events",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer pk_test_123",
          "Content-Type": "application/json",
        }),
      }),
    );
  });

  it("maps event/user/data to event_name/user_id/payload", async () => {
    const pk = makeClient();
    vi.mocked(fetch).mockResolvedValue(
      mockResponse({ success: true, data: { eventId: "1", receivedAt: "ts" } }),
    );
    await pk.notify({
      event: "payment.failed",
      user: "123",
      data: { amount: 99 },
    });

    expect(
      JSON.parse(vi.mocked(fetch).mock.calls[0]![1]!.body as string),
    ).toEqual({
      event_name: "payment.failed",
      user_id: "123",
      payload: { amount: 99 },
    });
  });
});

describe("notify error semantics", () => {
  it("throws PulseKitError on 4xx", async () => {
    const pk = makeClient();
    vi.mocked(fetch).mockRejectedValue(
      mockResponse(
        {
          success: false,
          error: "event is required.",
          status: 400,
        },
        400,
      ),
    );

    await expect(pk.notify({ user: "123" } as PulseKitEvent)).rejects.toThrow(
      PulseKitError,
    );
  });

  it("returns null on 5xx", async () => {
    const pk = makeClient();
    vi.mocked(fetch).mockResolvedValue(
      mockResponse(
        {
          success: false,
          error: "event is required.",
          status: 500,
        },
        500,
      ),
    );

    await expect(
      pk.notify({ event: "payment.failed", user: "123" }),
    ).resolves.toBeNull();
  });

  it("returns null on 429", async () => {
    const pk = makeClient();
    vi.mocked(fetch).mockResolvedValue(
      mockResponse(
        {
          success: false,
          error: "event is required.",
          status: 429,
        },
        429,
      ),
    );

    await expect(
      pk.notify({ event: "payment.failed", user: "123" }),
    ).resolves.toBeNull();
  });

  it("returns null on network failure", async () => {
    const pk = makeClient();
    vi.mocked(fetch).mockRejectedValue(new TypeError("fetch failed"));

    await expect(
      pk.notify({ event: "payment.failed", user: "123" }),
    ).resolves.toBeNull();
  });
});

describe("notify optional fields", () => {
  it("includes to and userName when provided", async () => {
    const pk = makeClient();
    vi.mocked(fetch).mockResolvedValue(
      mockResponse({ success: true, data: { eventId: "1", receivedAt: "ts" } }),
    );
    await pk.notify({
      event: "payment.failed",
      user: "123",
      data: { amount: 99 },
      to: "test@test.com",
      userName: "Test123",
    });

    expect(
      JSON.parse(vi.mocked(fetch).mock.calls[0]![1]!.body as string),
    ).toEqual({
      event_name: "payment.failed",
      user_id: "123",
      payload: { amount: 99 },
      to: "test@test.com",
      user_name: "Test123",
    });
  });

  it("omits to and userName when absent", async () => {
    const pk = makeClient();
    vi.mocked(fetch).mockResolvedValue(
      mockResponse({ success: true, data: { eventId: "1", receivedAt: "ts" } }),
    );
    await pk.notify({
      event: "payment.failed",
      user: "123",
      data: { amount: 99 },
    });

    expect(
      JSON.parse(vi.mocked(fetch).mock.calls[0]![1]!.body as string),
    ).toEqual({
      event_name: "payment.failed",
      user_id: "123",
      payload: { amount: 99 },
    });
  });

  it("defaults payload to {} when data is absent", async () => {
    const pk = makeClient();
    vi.mocked(fetch).mockResolvedValue(
      mockResponse({ success: true, data: { eventId: "1", receivedAt: "ts" } }),
    );
    await pk.notify({
      event: "payment.failed",
      user: "123",
    });

    expect(
      JSON.parse(vi.mocked(fetch).mock.calls[0]![1]!.body as string),
    ).toEqual({
      event_name: "payment.failed",
      user_id: "123",
      payload: {},
    });
  });
});

describe("notify timeout", () => {
  it("returns null after the timeout aborts the request", async () => {
    const pk = makeClient({ timeout: 10000 });
    vi.useFakeTimers();

    vi.mocked(fetch).mockImplementation((_url, init) => {
      return new Promise((_, reject) => {
        init?.signal?.addEventListener("abort", () => {
          reject(new DOMException("The operation was aborted.", "AbortError"));
        });
      });
    });

    const pending = pk.notify({ event: "payment.failed", user: "123" });

    vi.advanceTimersByTime(10000);

    await expect(pending).resolves.toBeNull();
  });
});
