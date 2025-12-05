const express = require("express");
const admin = require("firebase-admin");
const bodyParser = require("body-parser");
const app = express();

app.use(bodyParser.json());

// ===============================
// 🔥 قراءة الـ Service Account من Environment Variable
// ===============================
if (!process.env.SERVICE_ACCOUNT) {
  console.error("❌ Missing SERVICE_ACCOUNT environment variable");
  process.exit(1);
}

const serviceAccount = JSON.parse(process.env.SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// ===============================
// 🔥 الصفحة الرئيسية (مهم لرؤية السيرفر شغال)
// ===============================
app.get("/", (req, res) => {
  res.send("🚀 Notification API is running!");
});

// ===============================
// 🔥 API لإرسال الإشعار
// ===============================
app.post("/send-notification", async (req, res) => {
  try {
    const { title, body, token } = req.body;

    if (!token) {
      return res.status(400).json({ error: "Token is required" });
    }

    const message = {
      notification: { title, body },
      token,
    };

    const response = await admin.messaging().send(message);
    console.log("✅ Notification sent:", response);

    res.json({ success: true, response });
  } catch (error) {
    console.error("❌ Error sending notification:", error);
    res.status(500).json({ error: error.message });
  }
});

// ===============================
// 🔥 تشغيل السيرفر (Railway يحتاج PORT المتغير)
// ===============================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
