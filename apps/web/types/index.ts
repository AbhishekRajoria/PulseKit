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

export type Notification = {
  id: string;
  project_id: string;
  user_id: string;
  title: string;
  body: string | null;
  read: boolean;
  created_at: string;
};

export type Project = {
  id: string;
  user_id: string;
  name: string;
  rate_limit_per_min: number;
  created_at: string;
};

export type ProjectStats = {
  event_count: number;
  notification_count: number;
  unread_count: number;
  last_event_at: string | null;
  unique_users: number;
};

export type NotificationsResponse = {
  notifications: Notification[];
  unread_count: number;
};

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
};

export type ActionResponse<T> = {
  data: T | Record<string, unknown>;
  success: boolean;
  error?: string;
};
