import * as db from "./db_connection.js";
import { v4 as uuidv4 } from "uuid";



export async function insertEntity(name, entityType) {
  const client = await db.pool.connect();

  try {
    await client.query(
      `INSERT INTO entities (name, entity_type, created_at, updated_at) 
        VALUES ($1, $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [name, entityType]
    );

    return { status: true, name, entityType };
  } catch (e) {
    if (e.code === "23505") {
      // See: https://www.postgresql.org/docs/12/errcodes-appendix.html
      return {
        status: false,
        message: `${name} is already taken. Please try again`,
      };
    }
    return {
      status: false,
      message: `Error while inserting new ${entityType} with name: ${name} 
  ${e.detail}`,
    };
  } finally {
    client.release();
  }
}

export async function insertMeeting(entities, from, to, retry = false) {
  if (from >= to) {
    return {
      status: false,
      message: "From and to timestamps not properly set",
    };
  }

  const client = await db.pool.connect();

  try {
    await client.query("BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE");

    const queryText = `
    SELECT entity FROM bookings WHERE 
    entity=ANY($1) 
    AND (
            (from_ts <= to_timestamp($2) AND to_ts >= to_timestamp($2))
            OR
            (from_ts >= to_timestamp($2) AND from_ts <= to_timestamp($3))
        ) FOR UPDATE 
   `;

    const queryParams = [entities, from, to];

    const conflictingEntities = await client.query(queryText, queryParams);
    if (conflictingEntities.rows.length > 0) {
      await client.query("ROLLBACK");

      return {
        status: false,
        message: `Following entities have conflicting schedules: ${conflictingEntities.rows.map(
          (row) => row.entity
        )}`,
      };
    }
    const meetingId = uuidv4();
    try {
      await Promise.all(
        entities.map(async (entity) => {
          return client.query(
            `INSERT INTO bookings (meeting_id, entity, from_ts, to_ts, created_at, updated_at) 
        VALUES ($1, $2, to_timestamp($3), to_timestamp($4), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
            [meetingId, entity, from, to]
          );
        })
      );
      await client.query(`COMMIT`);
    } catch (e) {
      await client.query("ROLLBACK");
      if (e.code === "23503") {
        // See: https://www.postgresql.org/docs/12/errcodes-appendix.html
        return {
          status: false,
          message:
            "One or more of the entities to do not exist in the database",
        };
      }
      if (!retry) {
        //Retry only if
        // a) not already retried, and
        // b) all entities exist
        // c) some error has happenend (including overlapping schedule, which will be caught by the selection clause in the retry)
        return await insertMeeting(entities, from, to, true);
      }

      return { status: false, message: e.detail };
    }

    return { status: true, meetingId };
  } finally {
    client.release();
  }
}


