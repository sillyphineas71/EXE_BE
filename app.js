const express = require("express");

const apiRouter = require("./src/routes");
const errorHandler = require("./src/middlewares/errorHandler");
const { connectDatabase } = require("./src/config/database");

require("./src/models");

const app = express();

// parsers
app.use(express.json({ type: "*/*" }));
app.use(express.urlencoded({ extended: true }));

// ✅ FIX: if serverless-http sets req.body as Buffer/string, parse it
app.use((req, res, next) => {
  const ct = (req.headers["content-type"] || "").toLowerCase();

  if (Buffer.isBuffer(req.body)) {
    const raw = req.body.toString("utf8");
    if (ct.includes("application/json") || ct.includes("+json")) {
      try {
        req.body = JSON.parse(raw);
      } catch (e) {
        console.log("JSON parse failed, raw =", raw);
      }
    } else {
      req.body = raw;
    }
  } else if (typeof req.body === "string") {
    if (ct.includes("application/json") || ct.includes("+json")) {
      try {
        req.body = JSON.parse(req.body);
      } catch (e) {}
    }
  }

  next();
});




// // log (để kiểm tra)
// app.use((req, res, next) => {
//   const rid = req.headers["x-request-id"] || req.headers["x-amzn-trace-id"];
//   console.log("REQ", rid, req.method, req.originalUrl);
//   console.log("Headers:", {
//     "content-type": req.headers["content-type"],
//     "origin": req.headers["origin"],
//     "authorization": req.headers["authorization"] ? "yes" : "no",
//   });
//   console.log("Body:", req.body);
//   next();
// });

process.on("unhandledRejection", (reason) => {
  console.error("unhandledRejection:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("uncaughtException:", err);
});


app.use("/api/v1", apiRouter);
app.use(errorHandler);

// Lambda DB init
let dbReady = false;
let dbReadyPromise = null;

async function ensureDbConnected() {
  if (dbReady) return;
  if (!dbReadyPromise) {
    dbReadyPromise = connectDatabase().then(() => {
      dbReady = true;
    });
  }
  await dbReadyPromise;
}

module.exports = { app, ensureDbConnected };
