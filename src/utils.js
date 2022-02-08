

export const PG_USER = process.env.PG_USER;
export const PG_DATABASE = process.env.PG_DATABASE;
export const PG_PORT = process.env.PG_PORT;


export function convertDate(str){
    
    const timeStamp = Date.parse(str);
    if(!timeStamp){
        return {status: false, message: "Invalid Date"}
    }
    if(timeStamp.toString() === 'Invalid Date'){
        return {status: false, message: "Invalid Date"}
    }
    const stringifiedTimeStamp = new Date(timeStamp).toString();
    return{status: true, timeStamp: timeStamp, stringifiedTimeStamp }
    
}

export function extractUsers(str){
    return str.split(',').map(item => item.trim());
    
}


function tests(){
    console.log(convertDate('23 01 2024 13:11:00'));
    console.log(convertDate('01 23 2024 13:11:00'));
    console.log(convertDate('01 02 1999 13:00:58'));
    console.log(convertDate('01 02 1999 08:00:11'));
    console.log(convertDate('01 02 1999 13:00:99'));
}


