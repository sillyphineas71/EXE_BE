const path = require("path");
const dotenv = require("dotenv");

const envPath = process.env.ENV_PATH || path.resolve(process.cwd(), ".env");
dotenv.config({ path: envPath });

const getNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const config = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: getNumber(process.env.PORT, 3000),
  database: {
    url: process.env.DATABASE_URL || null,
    host: process.env.DB_HOST || "localhost",
    port: getNumber(process.env.DB_PORT, 5432),
    name: process.env.DB_NAME || "exe_db",
    username: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "",
    logging: process.env.DB_LOGGING === "true",
    sync: process.env.DB_SYNC === "true",
    ssl: process.env.DB_SSL === "true",
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET || "sillyphineas",
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1h",
    bcryptSaltRounds: getNumber(process.env.BCRYPT_SALT_ROUNDS, 10),
  },
};

module.exports = config;
