import dotenv from "dotenv";

// Load variables from .env file into process.env before checking
// In production (Firebase App Hosting), secrets and envs are injected directly
dotenv.config();

const requiredEnvVars = [
  "NEXT_PUBLIC_BASE_URL",
  "NEXT_PUBLIC_API_URL",
  "NEXT_PUBLIC_ALGOLIA_APP_ID",
  "NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY",
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_KOKO_REDIRECT_URL",
  "NEXT_PUBLIC_WHATSAPP_NUMBER",
  "NEXT_PUBLIC_PAYHERE_URL",
  "FIREBASE_ADMIN_PRIVATE_KEY",
  "FIREBASE_CLIENT_EMAIL",
  "TEXT_API_KEY",
  "HASH_SECRET",
  "KOKO_MERCHANT_ID",
  "KOKO_API_KEY",
  "KOKO_PRIVATE_KEY",
  "KOKO_PUBLIC_KEY",
  "RECAPTCHA_SECRET_KEY",
  "PAYHERE_MERCHANT_SECRET",
  "PAYHERE_MERCHANT_ID",
  "GEMINI_API_KEY",
];

const missingVars = [];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    missingVars.push(envVar);
  }
}

if (missingVars.length > 0) {
  console.error(
    `\n🚨 BUILD FAILED: Missing required environment variables:\n` +
    missingVars.map((v) => `   - ${v}`).join("\n") +
    `\nPlease ensure these are set in your .env file or deployment pipeline.\n`
  );
  process.exit(1);
}

console.log("✅ All required environment variables are present.");
