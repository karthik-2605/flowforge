const { Cron } = require('croner');

/**
 * Given a cron expression, return the next `count` run times.
 * Returns { valid: true, nextRuns: [...] } or { valid: false, error }.
 */
function getNextRuns(cronExpression, count = 5) {
  try {
    const cron = new Cron(cronExpression);

    const runs = cron.nextRuns(count);

    if (!runs || runs.length === 0) {
      return {
        valid: false,
        error: 'Expression does not produce future runs',
      };
    }

    return {
      valid: true,
      nextRuns: runs.map((d) => d.toISOString()),
    };
  } catch (err) {
    return {
      valid: false,
      error: err.message,
    };
  }
}

module.exports = { getNextRuns };
