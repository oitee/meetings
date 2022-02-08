import pkg from "pg";
import * as utils from "./utils.js";

const { Pool } = pkg;

const poolConfig = {
  user: utils.PG_USER,
  database: utils.PG_DATABASE,
  port: utils.PG_PORT,
  connectionTimeoutMillis: 60000,
  max: 5,
};

export let pool;

export function poolStart() {
  if (!pool || pool.ended) {
    pool = new Pool(poolConfig);
  }
}
