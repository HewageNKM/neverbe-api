const admin = require("firebase-admin");
const dotenv = require("dotenv");
const path = require("path");

// Load .env
dotenv.config({ path: path.join(__dirname, "../.env") });

const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID || "neverbe-18307",
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();
const SMS_TEMPLATES_COLLECTION = "sms_templates";

const templates = [
  {
    id: "ORDER_CONFIRMED",
    name: "Order Confirmation",
    en: "NEVERBE: Got it, {{customerName}}. Order #{{orderId}} is confirmed.",
    si: "NEVERBE: ස්තූතියි, {{customerName}}. ඔබගේ ඇණවුම #{{orderId}} තහවුරු කරන ලදී.",
    ta: "NEVERBE: நன்றி, {{customerName}}. உங்கள் ஆர்டர் #{{orderId}} உறுதிப்படுத்தப்பட்டது.",
    variables: ["customerName", "orderId"]
  },
  {
    id: "STATUS_COMPLETED",
    name: "Order Shipped (Completed)",
    en: "NEVERBE: Great news {{name}}! Your order #{{orderId}} is completed & shipped.{{trackingInfo}}",
    si: "NEVERBE: සුභ ආරංචියක් {{name}}! ඔබගේ ඇණවුම #{{orderId}} දැන් සම්පූර්ණ කර එවා ඇත.{{trackingInfo}}",
    ta: "NEVERBE: நற்செய்தி {{name}}! உங்கள் ஆர்டர் #{{orderId}} முடிக்கப்பட்டு அனுப்பப்பட்டது.{{trackingInfo}}",
    variables: ["name", "orderId", "trackingInfo"]
  },
  {
    id: "STATUS_CANCELLED",
    name: "Order Cancelled",
    en: "NEVERBE: Hi {{name}}, your order #{{orderId}} has been cancelled. Please contact us for details.",
    si: "NEVERBE: ආයුබෝවන් {{name}}, ඔබගේ ඇණවුම #{{orderId}} අවලංගු කර ඇත. විස්තර සඳහා අප අමතන්න.",
    ta: "NEVERBE: வணக்கம் {{name}}, உங்கள் ஆர்டர் #{{orderId}} ரத்து செய்யப்பட்டுள்ளது. விவரங்களுக்கு எங்களைத் தொடர்பு கொள்ளவும்.",
    variables: ["name", "orderId"]
  },
  {
    id: "STATUS_UPDATE",
    name: "General Status Update",
    en: "NEVERBE: Hi {{name}}, your order #{{orderId}} status has been updated to {{status}}.",
    si: "NEVERBE: ආයුබෝවන් {{name}}, ඔබගේ ඇණවුමේ #{{orderId}} තත්වය {{status}} ලෙස යාවත්කාලීන කර ඇත.",
    ta: "NEVERBE: வணக்கம் {{name}}, உங்கள் ஆர்டர் #{{orderId}} நிலை {{status}} என மாற்றப்பட்டுள்ளது.",
    variables: ["name", "orderId", "status"]
  },
  {
    id: "EBILL_SENT",
    name: "POS eBill SMS",
    en: "NEVERBE: Thank you for your purchase! View & download your eBill here: {{ebillUrl}}",
    si: "NEVERBE: ඔබගේ මිලදී ගැනීමට ස්තූතියි! ඔබගේ විද්‍යුත් බිල්පත (eBill) මෙතැනින් බලන්න: {{ebillUrl}}",
    ta: "NEVERBE: உங்கள் கொள்முதலுக்கு நன்றி! உங்கள் மின்-பற்றுச்சீட்டை (eBill) இங்கே பார்க்கலாம்: {{ebillUrl}}",
    variables: ["ebillUrl"]
  }
];

async function seed() {
  console.log("Starting definitive seeding...");
  for (const t of templates) {
    await db.collection(SMS_TEMPLATES_COLLECTION).doc(t.id).set(t);
    console.log(`Seeded: ${t.id}`);
  }
  console.log("All templates successfully seeded.");
  process.exit(0);
}

seed().catch(err => {
  console.error("Seed failed:", err);
  process.exit(1);
});
