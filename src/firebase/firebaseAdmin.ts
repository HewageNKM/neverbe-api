import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { getAuth, Auth } from "firebase-admin/auth";
import { getStorage, Storage } from "firebase-admin/storage";

let app: App;

if (!getApps().length) {
  const credentials = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  };

  app = initializeApp({
    credential: cert(credentials),
  });
} else {
  app = getApps()[0];
}

// 1. Pass the App instance and the Database ID ("default" or your new ID)
// Using getFirestore(app, "id") is the robust way to handle Enterprise databases
export const adminFirestore: Firestore = getFirestore(app, "default");

try {
  adminFirestore.settings({ ignoreUndefinedProperties: true });
} catch (e) {
  // Settings already initialized
}

export const adminAuth: Auth = getAuth(app);

export const adminStorageBucket = getStorage(app)
  .bucket(process.env.FIREBASE_STORAGE_BUCKET);