const config = require("./src/config/env");
const { app, ensureDbConnected } = require("./app");
const initWorkers = require("./src/workers/index");
const initCronJobs = require("./src/cron/index");

const start = async () => {
  try {
    await ensureDbConnected();
    initWorkers();
    initCronJobs();
    app.listen(config.port, () => {
      console.log(`API listening on port ${config.port}`);
    });
  } catch (error) {
    console.error("Failed to start server", error);
    process.exit(1);
  }
};

start();
