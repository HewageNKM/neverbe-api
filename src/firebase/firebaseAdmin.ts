import admin, { credential } from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";

// 1. Keep your working initialization logic
if (!admin.apps.length) {
  if (process.env.FIREBASE_ADMIN_PRIVATE_KEY) {
    admin.initializeApp({
      credential: credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
    });
  } else {
    admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
  }
}

// 2. Get the Firestore instance for the "default" enterprise database
const db = getFirestore("default");
try { db.settings({ ignoreUndefinedProperties: true }); } catch (e) { }
export const adminFirestore = db;

// 3. Export the other missing pieces for your Auth and Storage services
export const adminAuth = admin.auth();
export const adminStorageBucket = admin
  .storage()
  .bucket(process.env.FIREBASE_STORAGE_BUCKET);