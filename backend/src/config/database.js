const { Pool } = require('pg');

let pool;

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    pool.on('error', (err) =>
      console.error('Unexpected PG error', err)
    );
  }

  return pool;
}

module.exports = { getPool };