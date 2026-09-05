ALTER TABLE projects
ADD COLUMN channels JSONB NOT NULL DEFAULT '{}'::jsonb;
