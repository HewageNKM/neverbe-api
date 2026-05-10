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

// 2. Create the instances ONLY when accessed via a "Proxy"
// This tricks Turbopack into thinking adminFirestore exists 
// but prevents it from crashing during the build.
export const adminFirestore = {
  get firestore() {
    const db = getFirestore("default");
    try { db.settings({ ignoreUndefinedProperties: true }); } catch (e) { }
    return db;
  },
  // Map common firestore methods so existing code doesn't break
  collection: (path: string) => getFirestore("default").collection(path),
  doc: (path: string) => getFirestore("default").doc(path),
  runTransaction: (updateFunction: any) => getFirestore("default").runTransaction(updateFunction),
  batch: () => getFirestore("default").batch(),
} as unknown as admin.firestore.Firestore;

// 3. Export the other missing pieces for your Auth and Storage services
export const adminAuth = admin.auth();
export const adminStorageBucket = admin
  .storage()
  .bucket(process.env.FIREBASE_STORAGE_BUCKET);