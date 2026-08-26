export type Event = {
  id: string;
  event: string;
  user_id: string;
  payload?: Record<string, unknown>;
  status: "pending" | "sent" | "delivered" | "failed";
  channel: "email" | "sms" | "push";
  received_at: string;
};

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
};
