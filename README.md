# meetings
A Node.js application that schedules meetings for sepcific users in specific rooms

## Scope

This project supports the following features:

- **Add new users:** The system allows for the addition of new users. Once added, users can be included in future meetings.
- **Add new rooms:** Rooms signify the location of a given meeting. The system allows for inclusion of new rooms.
- **Scheduling of meetings**: The system allows for scheduling of new meetings involving one or more users at a given room.
- **Detect conflicts**: While setting up a meeting, the system will check if there are any time-slot conflicts (explained below) involving any of the proposed participants or the proposed room. 

The system interacts with the user on the Command Line.

## Design Goals

There are four key design goals.

_First_, the system should maintain its state in between system-runs. In other words, meetings scheduled during a paritcular system run, should persist during future system-runs. To ensure this, the system uses a relational database management system (PostgreSQL) to maintain its state.

_Second_, the names of users and rooms should be unique. In other words, the system will throw an appropriate error message if an attempt is made to insert a new user (or room) with an existing username.

_Third_, the system guarantees that a meeting should be permitted to be scheduled **only if** every participating user and the respective room have no time-slot conflict (explained below). Even if one entity has a conflict, the system will reject the request for setting up the meeting and prompt the user to try again.

_Fourth_, for the purposes of time-slot conflict-resolution, the system treats users and rooms alike. In other words, there is no distinction made between a 'user' and a 'room', when the system checks if there is a time-slot conflict.

### Resolving time-slot conflicts

One of the primary goals of the system is that there should not be any time-slot conflict. What constitutes a time-slot conflict? Simply put, it refers to a situation where a single user or room is assigned to more than one meeting at any given point of time. 

With respect to a meeting for a given time-slot A (with a start-point 's' and an end-point 'e'), there can be five types of time-slot conflicts, as shown below. 

- Case 1: A meeting which started before 's', but is scheduled to complete after the 's' (but before 'e'). 

- Case 2: A meeting which started before 's', and is scheduled to complete after 'e'.

- Case 3: A meeting which has the same start and end points as time-slot A.

- Case 4: A meeting which started and ended between points 's' and 'e'.

- Case 5: A meeting which started after 's' but before 'e'.

In each of these cases, there is a time-slot conflict, i.e., at least one point where there are two simultaneous meetings.

### How to resolve time-slot conflicts?

Obviously, if the parties involved in two meetings with conflicting time-slots are distinct and separate, there is no issue. The system will allow the both the meetings to continue.(_Note here that when we use 'participants', we include both users and rooms_).

Thus, only if, there is at least one common participant between the two conflicting time-slots, do we need to be careful. As per the design goal of the system, the system will prevent scheduling of any meeting that involves a time-slot conflict of at least one participant.

Thus, at the time of scheduling each meeting, we need to check if there is any potential conflict with respect to any of the participants of the meeting. 

To explain how this check is done, let's take a quick glance on the database schema of the system. 

#### Database Schema

There are two tables in the database supporting the system: `entities` and `bookings`. 

`entities` stores the list of all users and rooms:

```
                         Table "public.entities"
   Column    |           Type           | Collation | Nullable | Default 
-------------+--------------------------+-----------+----------+---------
 name        | text                     |           | not null | 
 entity_type | text                     |           | not null | 
 created_at  | timestamp with time zone |           |          | 
 updated_at  | timestamp with time zone |           |          | 
Indexes:
    "entities_pkey" PRIMARY KEY, btree (name)
Referenced by:
    TABLE "bookings" CONSTRAINT "bookings_entity_fkey" FOREIGN KEY (entity) REFERENCES entities(name)

```

`bookings` stores the list of every the meeting-to-entity pair. Note that the columns `from_ts` and `to_ts` represent the start and end points of each meeting.

```
                        Table "public.bookings"
   Column   |           Type           | Collation | Nullable | Default 
------------+--------------------------+-----------+----------+---------
 meeting_id | uuid                     |           | not null | 
 entity     | text                     |           | not null | 
 from_ts    | timestamp with time zone |           |          | 
 to_ts      | timestamp with time zone |           |          | 
 created_at | timestamp with time zone |           |          | 
 updated_at | timestamp with time zone |           |          | 
Indexes:
    "bookings_pkey" PRIMARY KEY, btree (meeting_id, entity)
Foreign-key constraints:
    "bookings_entity_fkey" FOREIGN KEY (entity) REFERENCES entities(name)

```

Now, each time, we have a request for scheduling a meeting, we first check if, out of all the participants proposed for the meeting, there is any participant with a time-conflict. We detect time-conflict by checking if the following expression is true:

      If any participating entity is part of a meeting where either
        - the meeting started before (or at) the start point of the proposed meeting AND has not ended before the start-point of the proposed meeting (_...Expression A_)
        - OR 
        - the meeting started after (or at) the start point of the proposed meeting AND has started before the end-point of the proposed meeting (_Expression B_)

The above expression can be expressed in SQL as follows:

```sql
 SELECT entity FROM bookings WHERE 
    entity=ANY(entity1, entity2... entityN) 
    AND (
            (from_ts <= to_timestamp(start_point) AND to_ts >= to_timestamp(start_point))
            OR
            (from_ts >= to_timestamp(start_point) AND from_ts <= to_timestamp(end_point))
        )

```
In the above example, `(entity1, entity2... entityN)` represents the list of all the participating entities of a proposed meeting and `start_point` and `end_point` represent the two end-points of the time-slot of the proposed meeting.

At the time of creating a new meeting, we run this query on our database. If this returns a non-empty response, it will signify a conflict and the system will prevent the creation of the meeting

#### Need for transactions

In an ideal world, we follow a two-step process while creating a new meeting:
- First, check for conflicts
- Next, insert the new meeting.

This approach has one downside: if there are more than one systems trying to write the database simultaneously, the database may change its state between step one and step two above. For example, let's say there are two systems attempting to simultaneously schedule the same meeting with the same time-slot and entities. It is possible, that read-write sequence takes place in the following manner:

- System 1 reads the database ... _(realises that there is no conflict)_
- System 2 reads the database ... _(realises that there is no conflict)_
- System 1 writes the database ... _(creates the meeting)_
- System 2 writes the database ... _(creates the same conflicting meeting)_

Thus, we need to take an all-or-nothing approach while reading and writing. In other words, we need to write the database, using ACID transactions. This will ensure (among other guarantees) that if at the time of making a write on the database, if the relevant part of database has progressed further from the last read, the system will exit the transaction to avoid any potential conflict.

## Running the System

As the system uses PostgreSQL deployed on Docker, the relevant Docker container needs to be started:

```
docker-compose up
```

The following database schema will need to be created:

```sql
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
```

To run the system

```
PG_USER=postgres PG_DATABASE=meetings PG_PORT=5432 node src/main.js
```



## Further Improvements

Here are some improvements that can be introduced to the system:

- 1. Allow for users and rooms to be deleted from the system
- 2. Provide a way to see the list of rooms where meetings can be scheduled
- 3. For a given time-slot, display the list of available rooms and available users
- 4. Ensure that there is at least and only one room for each meeting and there is at least one user for each meeting 
    - Currently, as the system treats both the users and rooms at the same level, it is possible to schedule meetings involving more than one room or without any room at all
- 6. Allow for modification of time-slot and/or number of participants of an already scheduled meeting
- 7. Allow for deletion of an existing meeting.
