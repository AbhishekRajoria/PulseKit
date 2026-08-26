export type Event = {
  id: string;
  event: string;
  userId: string;
  payload?: Record<string, unknown>;
  status: "pending" | "sent" | "delivered" | "failed";
  channel: "email" | "sms" | "push";
  receivedAt?: string;
};

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  code?: string
};
