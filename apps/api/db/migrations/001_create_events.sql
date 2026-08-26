CREATE TYPE event_status AS ENUM ('pending', 'sent', 'delivered', 'failed');

CREATE TABLE events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event text NOT NULL,
    user_id text NOT NULL,
    payload jsonb,
    status event_status DEFAULT 'pending' NOT NULL,
    channel text CHECK (channel IN ('email', 'sms', 'push')) NOT NULL,
    received_at timestamptz DEFAULT now() NOT NULL
);
