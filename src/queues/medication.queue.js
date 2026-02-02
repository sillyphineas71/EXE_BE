const Queue = require("bull");
const redisConfig = require("../config/redis");

const medicationQueue = new Queue("medication-reminders", {
  redis: redisConfig,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: true,
  },
});
medicationQueue.on("error", (err) => {
  console.error("❌ Queue error:", err);
});

medicationQueue.on("waiting", (jobId) => console.log("🕒 waiting job", jobId));
medicationQueue.on("failed", (job, err) =>
  console.log("❌ failed", job?.id, err),
);
medicationQueue.on("completed", (job) => console.log("✅ completed", job.id));

module.exports = medicationQueue;
