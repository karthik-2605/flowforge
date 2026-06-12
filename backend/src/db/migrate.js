require('dotenv').config();
console.log(process.env.DATABASE_URL);
const fs = require('fs');
const path = require('path');

const { getPool } = require('../config/database');

async function runMigrations() {
  const pool = getPool();

  const dir = path.join(__dirname, 'migrations');

  const files = fs.readdirSync(dir).sort();

  for (const file of files) {
    const sql = fs.readFileSync(
      path.join(dir, file),
      'utf8'
    );

    console.log(`Running migration: ${file}`);

    await pool.query(sql);
  }

  console.log('All migrations complete.');

  process.exit(0);
}

runMigrations().catch(console.error);