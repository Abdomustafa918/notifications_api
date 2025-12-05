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
// 🔥 الصفحة الرئيسية
// ===============================
app.get("/", (req, res) => {
  res.send("🚀 Notification API is running!");
});

// ===============================
// 🔥 API لإرسال الإشعار (يدعم token + topic)
// ===============================
app.post("/send-notification", async (req, res) => {
  try {
    const { title, body, token, topic } = req.body;

    let message;

    // إذا كان الإرسال لمستخدم معيّن عبر Token
    if (token) {
      message = {
        notification: { title, body },
        token,
      };
    }

    // إذا كان الإرسال لجميع المستخدمين عبر Topic
    else if (topic) {
      message = {
        notification: { title, body },
        topic,
      };
    }

    // لو مفيش لا token ولا topic
    else {
      return res
        .status(400)
        .json({ error: "Either 'token' or 'topic' is required!" });
    }

    const response = await admin.messaging().send(message);
    console.log("✅ Notification sent:", response);

    res.json({ success: true, response });
  } catch (error) {
    console.error("❌ Error sending notification:", error);
    res.status(500).json({ error: error.message });
  }
});

// ===============================
// 🔥 تشغيل السيرفر
// ===============================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
