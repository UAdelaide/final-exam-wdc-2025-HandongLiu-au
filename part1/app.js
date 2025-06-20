const express = require('express');
const mysql   = require('mysql2/promise');
const fs      = require('fs');
const path    = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

async function bootstrap() {
  const db = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    database: 'dogwalks'
  });

  const sql = fs.readFileSync(path.join(__dirname, 'dogwalks.sql'), 'utf8');
  await db.query(sql);

  app.locals.db = db;
}

bootstrap().catch(err => {
  console.error('Initialization failed', err);
  process.exit(1);
});

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
    res.status(500).json({ error: 'Failed to fetch open walk requests' });
  }
});

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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});