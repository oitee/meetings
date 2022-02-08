import assert from "assert";
import * as db from "../src/db_connection.js";
import * as model from "../src/model.js";

async function insertEntities() {
    const entity1 = "alice";
    const entity2 = "bob";
    const entity3 = "cat";
    const entity4 = "dog"
    //
    assert.ok(
      (await model.insertEntity(entity1, "user")).status,
      true,
      "name of task"
    );
    
  }

  beforeAll(async () => {
    db.poolStart();
    await db.pool.query(`
    DROP TABLE IF EXISTS bookings;
    DROP TABLE IF EXISTS entities;
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
    `);
  });
  afterAll(async () => {
    await db.pool.end();
  });


await test("Insertion of entities", insertEntities);