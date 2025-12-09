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

const db = admin.firestore();

// ===============================
// 🔥 الصفحة الرئيسية
// ===============================
app.get("/", (req, res) => {
  res.send("🚀 Notification API is running!");
});

// ===============================
// 🔥 API لإرسال الإشعار + حفظه في Firestore
// ===============================
app.post("/send-notification", async (req, res) => {
  try {
    const { title, body, token, topic, type } = req.body;

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
      return res.status(400).json({
        error: "Either 'token' or 'topic' is required!",
      });
    }

    // 🔥 إرسال الإشعار عبر Firebase Messaging
    const response = await admin.messaging().send(message);
    console.log("✅ Notification sent:", response);

    // 🔥 حفظ الإشعار داخل Firestore
    await db.collection("notifications").add({
      title,
      body,
      type: type || "general", // نوع الإشعار (منتج جديد — عرض جديد — ...إلخ)
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log("💾 Notification saved to Firestore!");

    res.json({
      success: true,
      message: "Notification sent & saved!",
      firebaseResponse: response,
    });

  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ===============================
// 🔥 تشغيل السيرفر
// ===============================
const PORT = process.env.PORT || 8080;
app.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT}`)
);
