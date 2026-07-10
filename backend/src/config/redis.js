const { Redis } = require("ioredis");

let redis;

function getRedis() {
  if (!redis) {
    redis = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      tls: {},
    });

    redis.on("connect", () => console.log("✅ Redis connected"));
    redis.on("error", (err) => console.error("Redis error:", err));
  }

  return redis;
}

module.exports = { getRedis };