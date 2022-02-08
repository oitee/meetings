import assert from "assert";
import * as db from "../src/db_connection.js";
import * as model from "../src/model.js";
import * as utils from "../src/utils.js";

// LIST OF ENTITIES TO BE USED FOR TESTS

const entity1 = "alice";
const entity2 = "bob";
const entity3 = "cat";
const entity4 = "dog";
const entity5 = "unknown Entity";

// TIMESLOT TO BE USED FOR SCHEDULING MEETINGS
const timeSlot1 = {};
timeSlot1.from = Math.floor(
  Date.parse(new Date("2022", "01", "15", "11", "00", "00")) / 1000
);
timeSlot1.to = Math.floor(
  Date.parse(new Date("2022", "01", "15", "12", "00", "00")) / 1000
);

/**
 * To test:
 * a) whether entity1, entity2, entity3 and entity4 can be inserted in the database, and
 * b) attempts to re-inserting the same entity fail
 *
 */
async function insertEntities() {
  // Inserting the four entities. This  should be successful
  assert.equal(
    (await model.insertEntity(entity1, "user")).status,
    true,
    "name of task"
  );
  assert.equal(
    (await model.insertEntity(entity2, "room")).status,
    true,
    "name of task"
  );
  assert.equal(
    (await model.insertEntity(entity3, "user")).status,
    true,
    "name of task"
  );
  assert.equal(
    (await model.insertEntity(entity4, "user")).status,
    true,
    "name of task"
  );
  // Re-inserting entity1 and entity2 should fail
  assert.equal(
    (await model.insertEntity(entity1, "user")).status,
    false,
    "name of task"
  );
  assert.equal(
    (await model.insertEntity(entity2, "user")).status,
    false,
    "name of task"
  );
}

/**
 * To test: attempts to schedule meetings with entities for non-overlapping time-slots succeed
 *
 */
async function meetingWithoutConflict() {
  // Attempts to schedule a meeting during timeSlot1 should succeed
  assert.equal(
    (
      await model.insertMeeting(
        [entity1, entity2],
        timeSlot1.from,
        timeSlot1.to
      )
    ).status,
    true,
    "Meeting with entity1 and entity2 for timeSlot1 should pass"
  );
  assert.equal(
    (
      await model.insertMeeting(
        [entity3, entity4],
        timeSlot1.from,
        timeSlot1.to
      )
    ).status,
    true,
    "Meeting with entity3 and entity4 for timeSlot1 should pass"
  );

  // Another attempt to schedule a meeting during a second non-overlapping time-slot should succeed
  const nonOverLappingTimeSlot = {};
  nonOverLappingTimeSlot.from = Math.floor(
    Date.parse(new Date("2022", "01", "16", "01", "00", "00")) / 1000
  );
  nonOverLappingTimeSlot.to = Math.floor(
    Date.parse(new Date("2022", "01", "16", "02", "00", "00")) / 1000
  );

  assert.equal(
    (
      await model.insertMeeting(
        [entity1],
        nonOverLappingTimeSlot.from,
        nonOverLappingTimeSlot.to
      )
    ).status,
    true,
    "Meeting with entity1 for the nonOverLappingTimeSlot should pass"
  );
  assert.equal(
    (
      await model.insertMeeting(
        [entity2, entity3],
        nonOverLappingTimeSlot.from,
        nonOverLappingTimeSlot.to
      )
    ).status,
    true,
    "Meeting with entity2 and entity3 for the nonOverLappingTimeSlot should pass"
  );
}
/**
 * To test: attempts to schedule meetings with conflicting schedules fail
 *
 */
async function meetingWithConflict() {
  // In this test, we will try to create a list of over-lapping time-slots which conflict with timeSlot1

  // timeSlot1 represents a time-slot between: 11:00AM and 12:00PM, on January 15, 2022

  // If we try to schedule another meeting with this same time-slot (involving same entities),
  // this will constitute an over-lapping time-slot

  // Additionally, we will try to create four time-slots representing three kinds of overlaps with timeSlot1

  // overLappingTimeSlot2 will represent a preceeding time-slot with a conflict with timeSlot1, i.e.,
  //between 9:00AM and 11:30AM, on January 15, 2022
  const overLappingTimeSlot2 = {};
  overLappingTimeSlot2.from = Math.floor(
    Date.parse(new Date("2022", "01", "15", "09", "00", "00")) / 1000
  );
  overLappingTimeSlot2.to = Math.floor(
    Date.parse(new Date("2022", "01", "15", "11", "30", "00")) / 1000
  );

  // overLappingTimeSlot3 will represent a short in-between time-slot between timeSlot1, i.e.,
  // between 11:15AM and 11:30AM, on January 15, 2022
  const overLappingTimeSlot3 = {};
  overLappingTimeSlot3.from = Math.floor(
    Date.parse(new Date("2022", "01", "15", "11", "15", "00")) / 1000
  );
  overLappingTimeSlot3.to = Math.floor(
    Date.parse(new Date("2022", "01", "15", "11", "30", "00")) / 1000
  );

  // overLappingTimeSlot4 will represent a longer time-slot overlapping with timeSlot1, i.e.,
  // between 9:00AM and 01:00PM, on Janurary 15, 2022
  const overLappingTimeSlot4 = {};
  overLappingTimeSlot4.from = Math.floor(
    Date.parse(new Date("2022", "01", "15", "09", "00", "00")) / 1000
  );
  overLappingTimeSlot4.to = Math.floor(
    Date.parse(new Date("2022", "01", "15", "13", "00", "00")) / 1000
  );

  // overLappingTimeSlot5 will represent a suceeding meeting with a conflict with timeSlot1, i.e.,
  // between 11:30AM and 01:00PM, on January 15, 2022
  const overLappingTimeSlot5 = {};
  overLappingTimeSlot5.from = Math.floor(
    Date.parse(new Date("2022", "01", "15", "11", "30", "00")) / 1000
  );
  overLappingTimeSlot5.to = Math.floor(
    Date.parse(new Date("2022", "01", "15", "13", "00", "00")) / 1000
  );

  // Scheduling meetings with entities 1-4, for the all of the above time-slots (including timeSlot1) should fail.
  assert.equal(
    (
      await model.insertMeeting(
        [entity1, entity2],
        timeSlot1.from,
        timeSlot1.to
      )
    ).status,
    false,
    "Scheduling a second meeting with timeSlot1 should fail"
  );
  assert.equal(
    (
      await model.insertMeeting(
        [entity1, entity2],
        overLappingTimeSlot2.from,
        overLappingTimeSlot2.to
      )
    ).status,
    false,
    "Scheduling a meeting with overlapping overLappingTimeSlot2 should fail"
  );
  assert.equal(
    (
      await model.insertMeeting(
        [entity1, entity2],
        overLappingTimeSlot3.from,
        overLappingTimeSlot3.to
      )
    ).status,
    false,
    "Scheduling a meeting with overlapping overLappingTimeSlot3 should fail"
  );
  assert.equal(
    (
      await model.insertMeeting(
        [entity1, entity2],
        overLappingTimeSlot4.from,
        overLappingTimeSlot4.to
      )
    ).status,
    false,
    "Scheduling a meeting with overlapping overLappingTimeSlot4 should fail"
  );
  assert.equal(
    (
      await model.insertMeeting(
        [entity1, entity2],
        overLappingTimeSlot5.from,
        overLappingTimeSlot5.to
      )
    ).status,
    false,
    "Scheduling a meeting with overlapping overLappingTimeSlot5 should fail"
  );
}

/**
 * To test attempts to schedule a meeting with entity not present in the DB fail
 */
async function meetingWithUnknownEntity() {
  // entity5 has not been inserted into the databse
  // Attempts to schedule a meeting involving entity5 should fail
  // Here, we will take a non-overlapping time-slot to ensure that
  // failure of tests has nothing to do with overlapping of timeslots

  // timeSlot6 is a non-overlapping time-slot: between 8:00AM and 8:30 AM, on February 20, 2022
  const timeSlot6 = {};
  timeSlot6.from = Math.floor(
    Date.parse(new Date("2022", "02", "20", "08", "00", "00")) / 1000
  );
  timeSlot6.to = Math.floor(
    Date.parse(new Date("2022", "02", "20", "08", "30", "00")) / 1000
  );

  assert.equal(
    (await model.insertMeeting([entity5], timeSlot6.to, timeSlot6.from)).status,
    false,
    "Scheduling a meeting involving entity5 should fail"
  );
  assert.equal(
    (
      await model.insertMeeting(
        [entity5, entity1],
        timeSlot6.to,
        timeSlot6.from
      )
    ).status,
    false,
    "Scheduling a meeting involving entity5 and entity1 should fail"
  );
}

function utilsTest() {
  // Valid time-stamps
  assert.equal(utils.convertDate("01 23 2024 13:11:00").status, true);
  assert.equal(utils.convertDate("01 02 1999 13:00:58").status, true);
  assert.equal(utils.convertDate("01 02 1999 08:00:11").status, true);

  //Invalid timestamps
  assert.equal(utils.convertDate("01 32 1999 12:00:00").status, false); 
  assert.equal(utils.convertDate("23 01 2024 13:11:00").status, false);
  assert.equal(utils.convertDate("23 01 3000 13:11:00").status, false); 
  assert.equal(utils.convertDate("01 02 1999 13:00:99").status, false); 
  assert.equal(utils.convertDate("01 02 1999 12:88:00").status, false); 
  assert.equal(utils.convertDate("01 02 1999 25:00:00").status, false); 
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
await test(
  "Schedule Meetings without conflicting timestamps",
  meetingWithoutConflict
);
await test("Schedule Meetings with conflicts", meetingWithConflict);
await test("Schedule Meetings with unknown user", meetingWithUnknownEntity);
test("Utils test", utilsTest);
