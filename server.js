const express=require("express");
const pkg=require("pg");
const dotenv = require("dotenv");

dotenv.config();
const { Pool } = pkg;
const app = express();
app.use(express.json());

// Connect to Supabase Postgres
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// 1️⃣ Add School API
app.post("/addSchool", async (req, res) => {
  const { name, address, latitude, longitude } = req.body;

  // Validation
  if (!name || !address || isNaN(latitude) || isNaN(longitude)) {
    return res.status(400).json({ error: "Invalid input data" });
  }

  try {
    const result = await pool.query(
      "INSERT INTO schools (name, address, latitude, longitude) VALUES ($1, $2, $3, $4) RETURNING *",
      [name, address, latitude, longitude]
    );
    res.status(201).json({ message: "School added successfully", school: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Database error" });
  }
});

// 2️⃣ List Schools Sorted by Proximity
app.get("/listSchools", async (req, res) => {
  const { lat, lng } = req.query;

  if (isNaN(lat) || isNaN(lng)) {
    return res.status(400).json({ error: "Invalid latitude/longitude" });
  }

  try {
    const result = await pool.query(
      `
      SELECT *, 
      (6371 * acos(
        cos(radians($1)) * cos(radians(latitude)) *
        cos(radians(longitude) - radians($2)) +
        sin(radians($1)) * sin(radians(latitude))
      )) AS distance
      FROM schools
      ORDER BY distance ASC
      `,
      [lat, lng]
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Database error" });
  }
});

// Start server
app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
