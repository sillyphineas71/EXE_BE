require("dotenv").config();

const redisConfig = {
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT),
  password: process.env.REDIS_PASSWORD,

  // TLS cho Redis Cloud + SNI
  // tls: {
  //   servername: process.env.REDIS_HOST,
  // },

  // Bull v3 hay chạy ổn hơn khi tắt ready check trên managed Redis
  enableReadyCheck: false,

  // ioredis option
  maxRetriesPerRequest: null,
};

module.exports = redisConfig;
