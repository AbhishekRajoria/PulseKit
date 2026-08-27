CREATE TABLE events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID REFERENCES projects(id) ON DELETE CASCADE,
  event_name  TEXT NOT NULL,
  user_id     TEXT NOT NULL,
  payload     JSONB NOT NULL DEFAULT '{}',
  received_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_events_project_id ON events(project_id);
CREATE INDEX idx_events_received_at ON events(received_at DESC);
