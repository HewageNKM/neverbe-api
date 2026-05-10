import admin, { credential } from "firebase-admin";

if (!admin.apps.length) {
  if (process.env.FIREBASE_ADMIN_PRIVATE_KEY) {
    admin.initializeApp({
      credential: credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(
          /\\n/g,
          "\n",
        ),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
    });
  } else {
    // This allows the build to pass without a key
    admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
  }
}

// Wrap these in a function or use a getter to prevent top-level execution during build
export const getFirestore = () => {
  const db = admin.firestore("default");
  try {
    db.settings({ ignoreUndefinedProperties: true });
  } catch (e) { }
  return db;
};

export const adminAuth = admin.auth();
export const adminStorageBucket = admin
  .storage()
  .bucket(process.env.FIREBASE_STORAGE_BUCKET);