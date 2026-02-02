// BE_Caredose/worker.js
require("./src/config/env"); // load .env (quan trọng)

const { connectDatabase } = require("./src/config/database");
const initWorkers = require("./src/workers/index");
const initCronJobs = require("./src/cron/index");

require("./src/models");

let heartbeatTimer = null;

// Luôn log ra CloudWatch nếu có lỗi ngầm (đỡ bị "im lặng")
process.on("unhandledRejection", (reason) => {
  console.error("❌ [UnhandledRejection]", reason);
});

process.on("uncaughtException", (err) => {
  console.error("❌ [UncaughtException]", err);

  // Cho log flush 1 nhịp rồi exit để ECS restart clean
  setTimeout(() => process.exit(1), 500);
});

async function main() {
  try {
    console.log("=== Worker boot ===");
    console.log("NODE_ENV =", process.env.NODE_ENV);
    console.log("TZ env   =", process.env.TZ); // nếu bạn set TZ trong Docker/taskdef
    console.log("Now ISO  =", new Date().toISOString());

    await connectDatabase();

    initWorkers();
    initCronJobs();

    console.log("✅ Fargate worker+cron started");

    // Heartbeat mỗi phút để xác nhận container vẫn chạy.
    heartbeatTimer = setInterval(() => {
      console.log(`💓 [Heartbeat] worker alive @ ${new Date().toISOString()}`);
    }, 60 * 1000);
  } catch (err) {
    console.error("❌ Worker failed to start", err);
    process.exit(1);
  }
}

main();

// Graceful shutdown
const shutdown = (signal) => {
  console.log(`${signal} received, shutting down...`);
  try {
    if (heartbeatTimer) clearInterval(heartbeatTimer);
  } catch (_) {}

  // Nếu bạn có close DB/redis, gọi ở đây (nếu connectDatabase trả connection handle)
  setTimeout(() => process.exit(0), 300);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
