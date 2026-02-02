// // src/cron/index.js
// const cron = require("node-cron");
// const runDailyJob = require("./daily.job");

// const initCronJobs = () => {
//   console.log("⏳ Hệ thống Cron Job đã được kích hoạt.");
//   cron.schedule(
//     "* * * * *",
//     () => {
//       console.log("🕛 Đã sang ngày mới. Chạy Daily Job...");
//       runDailyJob();
//     },
//     {
//       timezone: "Asia/Ho_Chi_Minh",
//     },
//   );
// };

// module.exports = initCronJobs;
// // 0 0 * * *

// src/cron/index.js
const cron = require("node-cron");
const runDailyJob = require("./daily.job");

// Lấy lịch từ env để tránh build sai image mà không biết
// - Test: "* * * * *" (mỗi phút)
// - Prod daily: "0 0 * * *" (00:00 mỗi ngày)
const CRON_SCHEDULE = process.env.CRON_SCHEDULE || "* * * * *";
const CRON_TIMEZONE = process.env.CRON_TIMEZONE || "Asia/Ho_Chi_Minh";

const initCronJobs = () => {
  console.log(
    `⏳ Hệ thống Cron Job đã được kích hoạt. schedule='${CRON_SCHEDULE}', tz='${CRON_TIMEZONE}'`,
  );

  if (typeof cron.validate === "function" && !cron.validate(CRON_SCHEDULE)) {
    throw new Error(`Invalid CRON_SCHEDULE: ${CRON_SCHEDULE}`);
  }

  const task = cron.schedule(
    CRON_SCHEDULE,
    () => {
      console.log(
        `🕛 [Cron] tick @ ${new Date().toISOString()} (tz=${CRON_TIMEZONE}) -> runDailyJob()`,
      );
      runDailyJob();
    },
    {
      timezone: "Asia/Ho_Chi_Minh",
    },
  );

  // Một số runtime có thể GC object nếu không giữ reference.
  // Giữ lại để chắc chắn job không bị "biến mất".
  globalThis.__cronTasks = globalThis.__cronTasks || [];
  globalThis.__cronTasks.push(task);
};

module.exports = initCronJobs;
// 0 0 * * *
