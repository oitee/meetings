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


insert into entities (name, entity_type, created_at, updated_at) values ('Zoomdog', 'user', '6/15/2021', '1/11/2022');
insert into entities (name, entity_type, created_at, updated_at) values ('Cogibox', 'room', '9/19/2021', '6/19/2021');
insert into entities (name, entity_type, created_at, updated_at) values ('Centidel', 'user', '1/1/2022', '4/18/2021');
insert into entities (name, entity_type, created_at, updated_at) values ('Jaxspan', 'user', '9/19/2021', '9/7/2021');
insert into entities (name, entity_type, created_at, updated_at) values ('Janyx', 'user', '8/16/2021', '7/7/2021');
insert into entities (name, entity_type, created_at, updated_at) values ('Oba', 'user', '11/14/2021', '10/19/2021');
insert into entities (name, entity_type, created_at, updated_at) values ('Wordify', 'room', '8/11/2021', '9/30/2021');
insert into entities (name, entity_type, created_at, updated_at) values ('Feedfish', 'user', '12/22/2021', '4/2/2021');
insert into entities (name, entity_type, created_at, updated_at) values ('Flipopia', 'user', '12/10/2021', '8/1/2021');
insert into entities (name, entity_type, created_at, updated_at) values ('Browsezoom', 'room', '6/24/2021', '4/6/2021');