CREATE TABLE projects (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID REFERENCES users(id) ON DELETE CASCADE,
  name               TEXT NOT NULL,
  api_key            TEXT UNIQUE NOT NULL,
  rate_limit_per_min INT NOT NULL DEFAULT 100,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
