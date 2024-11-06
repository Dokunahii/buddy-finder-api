const express = require("express");
let path = require('path');
const cors = require('cors');
const {Pool} = require('pg');
const { error } = require("console");
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
    const query = "INSERT INTO userinfo (firebaseuid, name, useraddress, age, gender) VALUES ($1, $2, $3, $4, $5) RETURNING *"
    const params = [req.body.firebaseuid, req.body.name, req.body.useraddress, req.body.age, req.body.gender]
    const result = await client.query(query, params)
    res.json(result.rows[0])
  } catch (err) {
    console.log(err.stack)
    res.status(500).json({ error: err.message})
  } finally {
    client.release()
  }
})

app.get("/profile/:uid", async(req,res) => {
  const client = await pool.connect()
  try {
    const query = "SELECT * FROM userinfo WHERE firebaseuid = $1"
    const params = [req.params.uid]
    const result = await client.query(query, params)
    res.status(200).json(result.rows[0])
  } catch (err) {
    console.error(err.stack)
    res.status(500).json({ error: err.message})
  } finally {
    client.release()
  }
})

app.post("/meeting", async(req,res) => {
  const client = await pool.connect()
  try {

    const userCheck = await client.query("SELECT id FROM userinfo WHERE firebaseuid = $1",[req.body.firebaseuid])
    const user_id = userCheck.rows[0].id

    let location_id = null
    const locationCheck = await client.query("SELECT id FROM locations WHERE address = $1",[req.body.address])

    if (locationCheck.rows.length > 0) {
      location_id = locationCheck.rows[0].id
    } else {
      const locationcreate = await client.query("INSERT INTO locations (address) VALUES ($1) RETURNING id",[req.body.address])
      location_id = locationcreate.rows[0].id
    }

    
    const query = "INSERT INTO meetings (date, time, location_id, title) VALUES ($1, $2, $3, $4) RETURNING *"
    const params = [req.body.date, req.body.time, location_id, req.body.title]
    const result = await client.query(query, params)

    const meeting_id = result.rows[0].id
    const userConnectQuery = "INSERT INTO userinfomeetings (user_id, meeting_id) VALUES ($1, $2)"
    const userConnectParams = [user_id, meeting_id]
    const userConnectResult = await client.query(userConnectQuery,userConnectParams)

    res.json(result.rows[0])
    
  } catch (err) {
    console.error(err.stack)
    res.status(500).json({ error: err.message })
  } finally {
    client.release()
  }
})

app.get("/meetings", async(req,res) => {
  const client = await pool.connect()
  try {
    const query = "SELECT meetings.*, userinfo.name, locations.address FROM userinfomeetings INNER JOIN meetings ON userinfomeetings.meeting_id = meetings.id INNER JOIN userinfo ON userinfomeetings.user_id = userinfo.id INNER JOIN locations ON meetings.location_id = locations.id"   
    const result = await client.query(query)
    res.status(200).json(result.rows)
  } catch (err) {
    console.error(err.stack)
    res.status(500).json( {error: err.message })
  } finally {
    client.release()
  }
})

app.get("/address/:id", async(req,res) => {
  const client = await pool.connect()
  try {
    const result = await client.query("SELECT * FROM locations WHERE id = $1",[req.params.id])
    res.status(200).json(result.rows[0])
  } catch (err) {
    console.error(err.stack)
    res.status(500).json({ error: err.message})
  } finally {
    client.release()
  }
})

app.post("/join/:uid", async(req,res) => {
  const client = await pool.connect()
  try {

    const userCheck = await client.query("SELECT id FROM userinfo WHERE firebaseuid = $1",[req.params.uid])
    const user_id = userCheck.rows[0].id

    const query = "INSERT INTO userinfomeetings (user_id, meeting_id) VALUES ($1, $2)"
    const params = [user_id, req.body.id]
    const result = await client.query(query,params)
    
  } catch (err) {
    console.error(err.stack)
    res.status(500).json({ error: err.message })
  } finally {
    client.release()
  }
})

app.get("/", (req, res) => res.send("Express on Vercel"));

app.listen(3002, () => console.log("Server ready on port."));

module.exports = app;