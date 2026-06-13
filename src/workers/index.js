// src/workers/index.js
const medicationQueue = require("../queues/medication.queue");
const processMedicationJob = require("./medication.worker");

const initWorkers = () => {
  console.log("🛠️  Khởi động hệ thống Workers...");

  // Gắn hàm xử lý vào Queue
  medicationQueue.process(processMedicationJob);

  // Lắng nghe sự kiện để log (Optional)
  medicationQueue.on("completed", (job) => {
    console.log(`[Queue] Job ${job.id} đã hoàn thành!`);
  });

  medicationQueue.on("failed", (job, err) => {
    console.log(`[Queue] Job ${job.id} bị lỗi: ${err.message}`);
  });
};

module.exports = initWorkers;
