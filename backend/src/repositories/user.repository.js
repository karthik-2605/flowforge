const { getPool } = require('../config/database');

async function findByEmail(email) {
  const pool = getPool();

  const result = await pool.query(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );

  return result.rows[0] || null;
}

async function create({ email, password, name }) {
  const pool = getPool();

  const result = await pool.query(
    `
    INSERT INTO users (email, password, name)
    VALUES ($1, $2, $3)
    RETURNING id, email, name
    `,
    [email, password, name]
  );

  return result.rows[0];
}

module.exports = {
  findByEmail,
  create,
};