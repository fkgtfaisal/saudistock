const { Pool } = require("pg");
require("dotenv").config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });

async function checkUser() {
  try {
    const res = await pool.query('SELECT * FROM "User" WHERE email = $1', ["fkgt1@hotmail.com"]);
    console.log("RESULT_DATA:", JSON.stringify(res.rows));
  } catch (err) {
    console.error("Database query error:", err);
  } finally {
    await pool.end();
  }
}

checkUser();
