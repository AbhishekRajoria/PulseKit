export type Event = {
  id: string;
  projectId: string;
  eventName: string;
  userId: string;
  payload: Record<string, unknown>;
  status: "delivered" | "failed" | "pending" | "rate_limited";
  channel: "email" | "slack" | "webhook" | "inapp";
  receivedAt: string;
};

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};
