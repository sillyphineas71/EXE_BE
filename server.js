const express = require("express");
const config = require("./src/config/env");
const { connectDatabase } = require("./src/config/database");
const apiRouter = require("./src/routes");
const errorHandler = require("./src/middlewares/errorHandler");
const initWorkers = require("./src/workers/index");
const initCronJobs = require("./src/cron/index");
require("./src/models");

const app = express();

app.use(express.json());
app.use("/api/v1", apiRouter);
app.use(errorHandler);

const start = async () => {
  try {
    await connectDatabase();
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
