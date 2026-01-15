require("dotenv").config();

const redisConfig = {
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT),
  password: process.env.REDIS_PASSWORD,
};

module.exports = redisConfig;

// require("dotenv").config();
// const Redis = require("ioredis");

// const redis = new Redis(process.env.REDIS_URL, {
//   tls: {}, // BẮT BUỘC cho Redis Cloud
// });

// redis.on("connect", () => {
//   console.log("✅ Redis connected");
// });

// redis.on("error", (err) => {
//   console.error("❌ Redis error:", err);
// });

// module.exports = redis;
