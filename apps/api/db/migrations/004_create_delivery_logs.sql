CREATE TABLE delivery_logs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id       UUID REFERENCES events(id) ON DELETE CASCADE,
  project_id     UUID REFERENCES projects(id) ON DELETE CASCADE,
  channel        TEXT NOT NULL CHECK (channel IN ('email', 'slack', 'webhook', 'inapp')),
  status         TEXT NOT NULL CHECK (status IN ('pending', 'delivered', 'failed', 'rate_limited', 'deduplicated')),
  attempt_number INT NOT NULL DEFAULT 1,
  error_message  TEXT,
  delivered_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_delivery_logs_event_id ON delivery_logs(event_id);
CREATE INDEX idx_delivery_logs_project_id ON delivery_logs(project_id);
CREATE INDEX idx_delivery_logs_status ON delivery_logs(status);
