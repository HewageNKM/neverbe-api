import admin, { credential } from "firebase-admin";
import { Firestore } from "@google-cloud/firestore";

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
let _firestore: Firestore | null = null;

export const adminFirestore = {
  get firestore() {
    if (!_firestore) {
      const config: any = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        ignoreUndefinedProperties: true,
      };
      if (process.env.FIREBASE_ADMIN_PRIVATE_KEY) {
        config.credentials = {
          client_email: process.env.FIREBASE_CLIENT_EMAIL,
          private_key: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        };
      }
      _firestore = new Firestore(config);
    }
    return _firestore;
  },
  // Map common firestore methods so existing code doesn't break
  collection: (path: string) => adminFirestore.firestore.collection(path),
  doc: (path: string) => adminFirestore.firestore.doc(path),
  runTransaction: (updateFunction: any) => adminFirestore.firestore.runTransaction(updateFunction),
  batch: () => adminFirestore.firestore.batch(),
} as unknown as admin.firestore.Firestore;

// 3. Export the other missing pieces for your Auth and Storage services
export const adminAuth = admin.auth();
export const adminStorageBucket = admin
  .storage()
  .bucket(process.env.FIREBASE_STORAGE_BUCKET);