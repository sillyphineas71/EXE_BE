// src/cron/index.js
const cron = require("node-cron");
const runDailyJob = require("./daily.job");

const initCronJobs = () => {
  console.log("⏳ Hệ thống Cron Job đã được kích hoạt.");
  cron.schedule(
    "* * * * *",
    () => {
      console.log("🕛 Đã sang ngày mới. Chạy Daily Job...");
      runDailyJob();
    },
    {
      timezone: "Asia/Ho_Chi_Minh",
    },
  );
};

module.exports = initCronJobs;