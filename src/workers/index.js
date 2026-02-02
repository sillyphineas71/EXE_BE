// // src/workers/index.js
// const medicationQueue = require("../queues/medication.queue");
// const processMedicationJob = require("./medication.worker");

// const initWorkers = () => {
//   console.log("🛠️  Khởi động hệ thống Workers...");

//   // Gắn hàm xử lý vào Queue
//   medicationQueue.process(processMedicationJob);

//   // Lắng nghe sự kiện để log (Optional)
//   medicationQueue.on("completed", (job) => {
//     console.log(`[Queue] Job ${job.id} đã hoàn thành!`);
//   });

//   medicationQueue.on("failed", (job, err) => {
//     console.log(`[Queue] Job ${job.id} bị lỗi: ${err.message}`);
//   });
// };

// module.exports = initWorkers;

// src/workers/index.js
const medicationQueue = require("../queues/medication.queue");
const processMedicationJob = require("./medication.worker");
const redisConfig = require("../config/redis");

const initWorkers = () => {
  console.log("🛠️  Khởi động hệ thống Workers...");

  console.log(
    `🔌 [Redis] host=${redisConfig.host} port=${redisConfig.port} tls=${Boolean(redisConfig.tls)}`,
  );

  // Bull/Redis lỗi kết nối thường là nguyên nhân container "chạy rồi im".
  // Bắt lỗi để CloudWatch thấy ngay.
  medicationQueue.on("error", (err) => {
    console.error("❌ [Bull] Queue error", err);
  });

  // In ra trạng thái kết nối (nếu Redis unreachable / TLS sai, bạn sẽ thấy ở đây)
  if (typeof medicationQueue.isReady === "function") {
    medicationQueue
      .isReady()
      .then(() => console.log("✅ [Bull] Queue is ready"))
      .catch((err) => console.error("❌ [Bull] Queue is NOT ready", err));
  }

  // Gắn hàm xử lý vào Queue
  medicationQueue.process(processMedicationJob);

  // Lắng nghe sự kiện để log (Optional)
  medicationQueue.on("completed", (job) => {
    console.log(`[Queue] Job ${job.id} đã hoàn thành!`);
  });

  medicationQueue.on("failed", (job, err) => {
    console.error(`[Queue] Job ${job?.id} bị lỗi: ${err?.message || err}`, err);
  });
};

module.exports = initWorkers;
