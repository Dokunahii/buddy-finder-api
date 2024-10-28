const express = require("express");
let path = require('path');
const cors = require('cors');
const {Pool} = require('pg');
require("dotenv").config()

const app = express();
app.use(cors());
app.use(express.json())

const DATABASE_URL = "postgresql://neondb_owner:pofGWib6IF5r@ep-cool-snow-a1gjgyrc-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"

const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: {
      require: true,
    }
})

async function getPostgresVersion() {
  const client = await pool.connect();
  try {
    const response = await client.query('SELECT version()');
    console.log(response.rows[0])
  } finally {
    client.release()
  }
}

getPostgresVersion()

app.post("/signUp", async (req,res) => {
  const client = await pool.connect()
  try {
    const query = "INSERT INTO userinfo (firebaseuid, name, useraddress) VALUES ($1, $2, $3) RETURN *"
    const params = [req.body.firebaseuid, req.body.name, req.body.useraddress]
    const result = await client.query(query, params)
    res.json(result.rows[0])
  } catch (err) {
    console.log(err.stack)
    res.status(500).json({ error: err.message})
  } finally {
    client.release()
  }
})

app.get("/", (req, res) => res.send("Express on Vercel"));

app.listen(3000, () => console.log("Server ready on port 3000."));

module.exports = app;