const express = require('express');
const mysql = require('mysql2/promise');

const app = express();
const PORT = 8080;

let db;

async function initDb() {
  db = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    database: 'DogWalkService'
  });
  console.log(' Connected to MySQL: DogWalkService');
}
// /api/dogs
app.get('/api/dogs', async (req, res) => {
  try {
    const [rows] = await app.locals.db.execute(`
      SELECT d.name AS dog_name,
             d.size AS size,
             u.username AS owner_username
      FROM Dogs d
      JOIN Users u ON d.owner_id = u.user_id
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch dogs' });
  }
});

// /api/walkrequests/open
app.get('/api/walkrequests/open', async (req, res) => {
  try {
    const [rows] = await app.locals.db.execute(`
      SELECT wr.request_id,
             d.name AS dog_name,
             wr.requested_time,
             wr.duration_minutes,
             wr.location,
             u.username AS owner_username
      FROM WalkRequests wr
      JOIN Dogs d ON wr.dog_id = d.dog_id
      JOIN Users u ON d.owner_id = u.user_id
      WHERE wr.status = 'open'
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch walk requests' });
  }
});

// /api/walkers/summary
app.get('/api/walkers/summary', async (req, res) => {
  try {
    const [rows] = await app.locals.db.execute(`
      SELECT u.username AS walker_username,
             COUNT(r.rating_id) AS total_ratings,
             AVG(r.rating) AS average_rating,
             COUNT(r.rating_id) AS completed_walks
      FROM Users u
      LEFT JOIN WalkApplications wa ON wa.walker_id = u.user_id
      LEFT JOIN WalkRatings r ON r.application_id = wa.application_id
      WHERE u.user_type = 'walker'
      GROUP BY u.username
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch walker summary' });
  }
});

initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error(' MySQL connection failed:', err);
});