const { getPool } = require('../config/database');

async function upsert({ name, status }) {
  const pool = getPool();

  const result = await pool.query(
    `INSERT INTO workers (name, status, last_heartbeat)
     VALUES ($1, $2, NOW())
     ON CONFLICT (name) DO UPDATE
       SET status = $2,
           last_heartbeat = NOW()
     RETURNING *`,
    [name, status]
  );

  return result.rows[0];
}

async function incrementProcessed(name) {
  const pool = getPool();

  await pool.query(
    `UPDATE workers
     SET jobs_processed = jobs_processed + 1
     WHERE name = $1`,
    [name]
  );
}

async function findAll() {
  const pool = getPool();

  const result = await pool.query(
    'SELECT * FROM workers ORDER BY created_at'
  );

  return result.rows;
}

async function markOffline(name) {
  const pool = getPool();

  await pool.query(
    "UPDATE workers SET status = 'offline' WHERE name = $1",
    [name]
  );
}

module.exports = {
  upsert,
  incrementProcessed,
  findAll,
  markOffline,
};
