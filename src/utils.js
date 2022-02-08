export const PG_USER = process.env.PG_USER;
export const PG_DATABASE = process.env.PG_DATABASE;
export const PG_PORT = process.env.PG_PORT;

export function convertDate(str) {
  const timeStamp = Date.parse(str);
  if (!timeStamp) {
    return { status: false, message: "Invalid Date" };
  }
  if (timeStamp.toString() === "Invalid Date") {
    return { status: false, message: "Invalid Date" };
  }
  const stringifiedTimeStamp = new Date(timeStamp).toString();
  return { status: true, timeStamp: timeStamp, stringifiedTimeStamp };
}

export function explodeCommas(str) {
  return str.split(",").map((item) => item.trim());
}
