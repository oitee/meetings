import readline from "readline";
import * as db from "./db_connection.js";
import * as model from "./model.js";
import * as utils from "./utils.js";

db.poolStart();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function start() {
  console.log(`If you want to add a new user, enter 'u'
If you want to add a new room, enter 'r'
If you want to schedule a new meeting, enter 'm'
----
To quit, enter 'q'
  `);

  rl.question(
    `>
`,
    async (input) => {
      if (input === "q") {
        await model.poolEnd();
        rl.close();
      } else if (input === "u") {
        enterNewEntity("user");
      } else if (input === "r") {
        enterNewEntity("room");
      } else if (input === "m") {
        scheduleNewMeeting();
      } else {
        console.log(`Invalid input`);
        await start();
      }
    }
  );
}

async function enterNewEntity(entity) {
  console.log(`Enter the name of the ${entity}`);
  rl.question(`> `, async (input) => {
    model.insertEntity(input, entity)
    .then(response => {
      if (response.status) {
        console.log(`New ${entity} added!`);
        return start();
      }
      console.log(response.message);
      console.log();
      return start();
    })
    
  });
}

async function scheduleNewMeeting() {
  let fromTimeStamp;
  let toTimeStamp;
  let entities = [];
  console.log(`Enter the date and time when the meeting should BEGIN,  in the following format: MM DD YYYY hh:mm:ss. 
  For example, for scheduling a meeting beginning at 3pm on 7th February, 2022, you should enter: 02 07 2022 14:00:00 
  `);
  rl.question(`> `, (from) => {
    let fromTimeObj = utils.convertDate(from);
    if (!fromTimeObj.status) {
      console.log(`Invalid TimeStamp format: ${fromTimeObj.message}`);
      console.log(`Please Retry`);
      console.log();
      return start();
    }
    fromTimeStamp = fromTimeObj.timeStamp;
    console.log(
      `Enter the Date and time when the meeting should END, in the SAME format`
    );
    rl.question(`> `, (to) => {
      let toTimeObj = utils.convertDate(to);
      if (!toTimeObj.status) {
        console.log(`Invalid TimeStamp format: ${toTimeObj.message}`);
        console.log(`Please Retry`);
        console.log();
        return start();
      }
      toTimeStamp = toTimeObj.timeStamp;
      console.log(`Please confirm the time period of the meeting:`);
      console.log(`Meeting to begin at: ${fromTimeObj.stringifiedTimeStamp}`);
      console.log(`Meeting to end at: ${toTimeObj.stringifiedTimeStamp}`);
      console.log(`Press '1', to retry`);
      console.log(`Press any other key to continue`);
      rl.question(`> `, (confirmTime) => {
        if (confirmTime == "1") {
          return start();
        }
        if (fromTimeStamp > toTimeStamp) {
          console.log(
            `The beginning timestamp should be less than the ending timestamp`
          );
          console.log();
          return start();
        }

        console.log(`Enter the Room where the meeting should take place`);
        rl.question(`> `, (room) => {
          if (room === "") {
            console.log("Please enter a valid string");
            return start();
          }
          entities.push(room);

          console.log(
            `Please enter the usernames of participants attending this meeting.`
          );
          console.log(`NOTE: each names should be separated by commas (',')`);
          rl.question(`> `, (users) => {
            let listOfUsers = utils.extractUsers(users);
            listOfUsers.forEach((user) => entities.push(user));
            model
              .insertMeeting(entities, fromTimeStamp, toTimeStamp)
              .then((response) => {
                if (response.status) {
                  console.log(`Meeting has been successfully scheduled!`);
                  console.log(`Meeting ID: ${response.meetingId}`);
                  console.log(`Meeting to take place at ${room}`);
                  console.log(
                    `The meeting will start at ${fromTimeObj.stringifiedTimeStamp}`
                  );
                  console.log(
                    `The meeting will end at ${toTimeObj.stringifiedTimeStamp}`
                  );
                  console.log(`Participants: ${users}`);
                  console.log(`......`);
                  console.log();
                  return start();
                }
                console.log(`Error: ${response.message}`);
                console.log(`Please retry again`);
                console.log(`......`);
                console.log();
                return start();
              });
          });
        });
      });
    });
  });
}

start();
