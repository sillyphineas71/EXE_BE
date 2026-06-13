// const serverless = require("serverless-http");
// const { app, ensureDbConnected } = require("./app");

// module.exports.handler = async (event, context) => {
//   console.log("EVENT_DEBUG", {
//     method: event?.requestContext?.http?.method || event?.httpMethod,
//     path: event?.rawPath || event?.path,
//     contentType:
//       event?.headers?.["content-type"] || event?.headers?.["Content-Type"],
//     isBase64Encoded: event?.isBase64Encoded,
//     bodyLength: event?.body ? event.body.length : 0,
//   });

//   context.callbackWaitsForEmptyEventLoop = false;
//   await ensureDbConnected();
//   return baseHandler(event, context);
// };


// const baseHandler = serverless(app);

// // AWS Lambda entrypoint
// module.exports.handler = async (event, context) => {
//   // Let the container be reused even if the event loop isn't empty (e.g., DB pool)
//   context.callbackWaitsForEmptyEventLoop = false;

//   // Connect DB once on cold start
//   await ensureDbConnected();

//   return baseHandler(event, context);
// };

const serverless = require("serverless-http");
const { app, ensureDbConnected } = require("./app");

const baseHandler = serverless(app);

module.exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  await ensureDbConnected();
  return baseHandler(event, context);
};