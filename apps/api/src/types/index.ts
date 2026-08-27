export type EventRow = {
  id: string;
  project_id: string;
  event_name: string;
  user_id: string;
  payload: Record<string, unknown>;
  received_at: string;
};

export type DeliveryRow = {
  id: string;
  event_id: string;
  project_id: string;
  channel: "email" | "slack" | "webhook" | "inapp";
  status: "pending" | "delivered" | "failed" | "rate_limited" | "deduplicated";
  attempt_number: number;
  error_message: string | null;
  delivered_at: string;
};

export type Event = EventRow & Pick<DeliveryRow, "status" | "channel">;

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
};

declare global {
  namespace Express {
    interface Request {
      project_id: string;
    }
  }
}
