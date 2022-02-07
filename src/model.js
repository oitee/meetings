import * as db from "./db_connection.js";
import { v4 as uuidv4 } from 'uuid';

export async function insertEntity(name, entityType) {
  const client = await db.pool.connect();

  try {
    await client.query(
      "INSERT INTO entities (name, entity_type, created_at, updated_at) values ($1, $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)",
      [name, entityType]
    );
    await client.release();

    return { status: true, name, entityType };
  } catch (e) {
    await client.release();
    if(e.code === '23505'){
        return {status: false, message: `Already exists`, name, entityType};
    }
    return { status: false, message: e.detail, name, entityType };
  }
}


export async function insertMeeting(entities, from, to, retry=false){
   const client = await db.pool.connect();

   await client.query('BEGIN');

    /*
    SELECT * from bookings WHERE entity = $1 AND from_ts <= from AND to_ts >= from
    SELECT * from bookings WHERE entity = $1 AND from_ts >= from AND from_ts <= to; 
    */

   let queryText = `SELECT entity FROM bookings WHERE entity=ANY($1) 
   AND ((from_ts <= to_timestamp($2) AND to_ts >= to_timestamp($2))
   OR
   (from_ts >= to_timestamp($2) AND from_ts <= to_timestamp($3)))
   `

   let queryParams = [entities, from, to];

   let res = await client.query(queryText, queryParams);
   if(res.rows.length > 0){
       await client.query("ROLLBACK").then((res) => client.release());
       
       let entitiesWithConflict = res.rows.map(row => {
           row.entity;
       })
       return {status: false, message: "One or more entities have conflicting schedules", entitiesWithConflict};
   }
   try{
      await Promise.all(entities.map(entity => {
        const id = uuidv4();
        client.query(`INSERT INTO bookings (meeting_id, entity, from_ts, to_ts, created_at, updated_at) VALUES ($1, $2, to_timestamp($3), to_timestamp($4), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`, [id, entity, from, to]);
    }))
       
   }
   catch(e){
    if(!retry){
        await insertMeeting(entities, from, to, true);
    }
    await client.query("ROLLBACK").then((res) => client.release());
   }
   await client.query(`COMMIT`);
   await client.release();
   return {status: true};
}





// let res1 = await insertEntity("Cat", "room");
// console.log(res1);
// let res2 = await insertEntity("Cat", "room");
// console.log(res2);

let from = Math.floor(Date.parse(new Date('2022', '01', '15', '11', '00', '11'))/ 1000);
let to = Math.floor(Date.parse(new Date('2022', '01', '15', '12', '00', '11'))/ 1000)

// console.log(from)
// console.log(to)

 console.log(await insertMeeting(['Cat', 'Dog'], from, to))
 await insertEntity("Dog", "user");
 await insertEntity("Pea", "user")
 await insertEntity("Q", "user");
 console.log(await insertMeeting(["Pea", "Q"], from, to));
 console.log(await insertMeeting(["Pea", "Dog"], from, to));
 console.log(await insertMeeting(['Oba', 'Pea'], from, to));
//  console.log(await insertMeeting(['Dog'], from, to))

console.log(await insertMeeting(["Oiti"], from, to))
 await db.pool.end();