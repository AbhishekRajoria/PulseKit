export type DeliveryLog = {
  id: string;
  event_id: string;
  project_id: string;
  channel: "email" | "slack" | "webhook" | "inapp";
  status: "pending" | "delivered" | "failed" | "rate_limited" | "deduplicated";
  attempt_number: number;
  error_message: string | null;
  delivered_at: string;
};

export type Event = {
  id: string;
  event_name: string;
  project_id: string;
  user_id: string;
  payload?: Record<string, unknown>;
  logs: DeliveryLog[];
  received_at: string;
};

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
};
