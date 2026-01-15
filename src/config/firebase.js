const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey");
try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log("✅ Firebase Admin initialized successfully");
} catch (error) {
  console.error("❌ Firebase Admin initialization failed:", error.message);
}

module.exports = admin;
