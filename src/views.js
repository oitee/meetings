import readline from "readline";
import * as controller from "./controller.js";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function start() {
  rl.question(
    `If you want to add a new user, enter 'u'
If you want to add a new room, enter 'r'
If you want to schedule a new meeting, enter 'm'
----
To quit, enter 'q'
`,
    (input) => {

      if (input === "q") {
        rl.close();
      } else if (input === "u") {
        enterNewEntity('user');
      } else if (input === "r") {
        enterNewEntity('room');
      } else if (input === "m") {
        scheduleNewMeeting();
      } else {
        console.log(`Invalid input`);
        start();
      }
    }
  );
}

function enterNewEntity(entity) {
  rl.question(
    `Enter the name of the ${entity} 
`,
    (input) => {
      const response = controller.addEntity(input);
      if (response.status) {
        console.log(`New ${entity} added!`);
        return start();
      }
      if (response.message === "Already present") {
        console.log(`That name is already taken. Try another name for the ${entity}`);
        return enterNewEntity(entity);
      } 
      console.log(`Could not add a new ${entity}. Error message: ${response.message}`);
      rl.question(`If you want to try again, enter '1'`, (input) => {
      if (input === "1") {
          return enterNewEntity(entity);
          }
          console.log()
          return start();
        });
      
    }
  );
}


function scheduleNewMeeting() {
  const newMeeting = new Map();
  rl.question(
    `Enter the date and time of the meeting in this format: YYYYMMDDHHMMSS. 
For example, for scheduling a meeting at 3pm on 7th February, 2022, you should enter: 20220207150000
`,
    (date) => {
      newMeeting.set('date', date);
      rl.question(`Enter the room for scheduling the meeting 
`, (room) => {
        newMeeting.set('room', room);
        rl.question(`Enter the users who will be attending this meeting. Users should be added in a comma-separated manner
`, (users) => {
  newMeeting.set('users', users);
  let response = controller.setMeeting(newMeeting);
  if(response.status){
    console.log(`New Meeting successfully scheduled!`)
    console.log();
    return start();
  }
  if(response.message === "Room conflict"){
    console.log(`A meeting is already scheduled during this time-frame. Try another room`);
    return scheduleNewMeeting();
  }
  if(response.message === "User conflict"){
    console.log(`The meeting could not be scheduled, as the following user(s) have a conflict`);
    let userList = "";
    response.users.forEach(user => userList = userList + " " + user + ",");
    console.log(userList.substring(0, userList.length - 1));
    console.log();
    return scheduleNewMeeting();
  }
  else{
    true;//!
  }
})
      })
      start();
    }
  );
}



start();
