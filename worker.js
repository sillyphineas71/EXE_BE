const { connectDatabase } = require("./src/config/database");
require("./src/models");
const initWorkers = require("./src/workers");
const initCronJobs = require("./src/cron");

const startWorker = async () => {
  try {
    await connectDatabase();
    initWorkers();
    initCronJobs();
    console.log("✅ CareDose worker is running...");
  } catch (error) {
    console.error("❌ Failed to start worker:", error);
    process.exit(1);
  }
};

startWorker();

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});
