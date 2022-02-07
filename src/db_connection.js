import pkg from 'pg';


const {Pool} = pkg;

const poolConfig = {
  user: "postgres",
  database: "meetings",
  port: 5432,
  connectionTimeoutMillis: 60000,
  max: 5,
};

export let pool = new Pool(poolConfig);
