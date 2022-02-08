DROP DATABASE IF EXISTS meetings;
CREATE DATABASE meetings;
\connect meetings;

CREATE TABLE entities (
    name text PRIMARY KEY,
    entity_type TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE bookings (
    meeting_id UUID,
    entity text REFERENCES entities(name),
    from_ts TIMESTAMP WITH TIME ZONE,
    to_ts TIMESTAMP WITH TIME ZONE, 
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    PRIMARY KEY(meeting_id, entity)
);

