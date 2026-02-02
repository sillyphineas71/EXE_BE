// require("dotenv").config();

// const redisConfig = {
//   host: process.env.REDIS_HOST || "localhost",
//   port: parseInt(process.env.REDIS_PORT) || 6379,
//   password: process.env.REDIS_PASSWORD || undefined,
// };

// module.exports = redisConfig;

require("dotenv").config();

const host = process.env.REDIS_HOST || "localhost";
const port = Number(process.env.REDIS_PORT || 6379);

// Redis Cloud thường dùng ACL user = "default"
const username = process.env.REDIS_USERNAME || "default";
const password = process.env.REDIS_PASSWORD || undefined;

const useTLS =
  String(process.env.REDIS_TLS || "").toLowerCase() === "true" ||
  String(process.env.REDIS_SCHEME || "").toLowerCase() === "rediss";

const redisConfig = {
  host,
  port,
  username, // ✅ thêm dòng này
  password,
  ...(useTLS ? { tls: { servername: host } } : {}), // ✅ thêm SNI nếu TLS
  enableReadyCheck: false,
  maxRetriesPerRequest: null,
};

module.exports = redisConfig;
