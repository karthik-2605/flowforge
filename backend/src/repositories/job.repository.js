const { getPool } = require("../config/database");

async function create({
  userId,
  name,
  jobType,
  cronExpression,
  payload,
  retryCount,
}) {
  const pool = getPool();

  const result = await pool.query(
    `INSERT INTO jobs
    (user_id, name, job_type, cron_expression, payload, retry_count)
    VALUES ($1,$2,$3,$4,$5,$6)
    RETURNING *`,
    [
      userId,
      name,
      jobType,
      cronExpression,
      JSON.stringify(payload),
      retryCount,
    ]
  );

  return result.rows[0];
}

async function findAllByUser(
  userId,
  { status, jobType, search } = {}
) {
  const pool = getPool();

  let query = "SELECT * FROM jobs WHERE user_id = $1";

  const params = [userId];

  let i = 2;

  if (status) {
    query += ` AND status = $${i++}`;
    params.push(status);
  }

  if (jobType) {
    query += ` AND job_type = $${i++}`;
    params.push(jobType);
  }

  if (search) {
    query += ` AND name ILIKE $${i++}`;
    params.push(`%${search}%`);
  }

  query += " ORDER BY created_at DESC";

  const result = await pool.query(query, params);

  return result.rows;
}

async function findById(id) {
  const pool = getPool();

  const result = await pool.query(
    "SELECT * FROM jobs WHERE id = $1",
    [id]
  );

  return result.rows[0] || null;
}

async function update(id, updates) {
  const pool = getPool();

  const result = await pool.query(
    `UPDATE jobs
     SET name=$1,
         job_type=$2,
         cron_expression=$3,
         payload=$4,
         retry_count=$5,
         updated_at=NOW()
     WHERE id=$6
     RETURNING *`,
    [
      updates.name,
      updates.jobType,
      updates.cronExpression,
      JSON.stringify(updates.payload),
      updates.retryCount,
      id,
    ]
  );

  return result.rows[0];
}

async function updateStatus(id, status) {
  const pool = getPool();

  const result = await pool.query(
    `UPDATE jobs
     SET status=$1,
         updated_at=NOW()
     WHERE id=$2
     RETURNING *`,
    [status, id]
  );

  return result.rows[0];
}

async function remove(id) {
  const pool = getPool();

  await pool.query(
    "DELETE FROM jobs WHERE id=$1",
    [id]
  );
}

module.exports = {
  create,
  findAllByUser,
  findById,
  update,
  updateStatus,
  remove,
};