const Queue = require("bull");
const redisConfig = require("../config/redis");

const medicationQueue = new Queue("medication-reminders", {
  redis: redisConfig,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: true,
  },
});

module.exports = medicationQueue;
