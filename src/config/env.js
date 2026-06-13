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
  email: {
    service: process.env.EMAIL_SERVICE || "gmail",
    user: process.env.EMAIL_USER || "",
    password: process.env.EMAIL_PASSWORD || "",
    fromName: process.env.EMAIL_FROM_NAME || "CareDose",
    fromAddress: process.env.EMAIL_FROM_ADDRESS || process.env.EMAIL_USER || "",
  },
  firebase: {
    type: process.env.FB_TYPE,
    project_id: process.env.FB_PROJECT_ID,
    private_key_id: process.env.FB_PRIVATE_KEY_ID,
    private_key: process.env.FB_PRIVATE_KEY,
    client_email: process.env.FB_CLIENT_EMAIL,
    client_id: process.env.FB_CLIENT_ID,
    auth_uri: process.env.FB_AUTH_URI,
    token_uri: process.env.FB_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.FB_AUTH_PROVIDER,
    client_x509_cert_url: process.env.FB_CLIENT_X500,
    universe_domain: process.env.FB_UNIVERSE_DOMAIN,
  },
};

module.exports = config;