import { adminFirestore, adminStorageBucket } from "@/firebase/firebaseAdmin";

// ============ NAVIGATION LOGIC ============

export interface NavigationConfig {
  mainNav: any[];
  footerNav: any[];
}

export const getNavigationConfig = async () => {
  try {
    console.log("Fetching navigation config");
    const doc = await adminFirestore
      .collection("site_config")
      .doc("navigation")
      .get();
    if (!doc.exists) {
      return { mainNav: [], footerNav: [] };
    }
    return doc.data() as NavigationConfig;
  } catch (e) {
    console.error(e);
    throw e;
  }
};

export const saveNavigationConfig = async (config: NavigationConfig) => {
  try {
    console.log("Saving navigation config");
    await adminFirestore
      .collection("site_config")
      .doc("navigation")
      .set(config, { merge: true });
    return { success: true };
  } catch (e) {
    console.error("Error saving navigation config:", e);
    throw e;
  }
};

// ============ NAVIGATION LOGIC ============

// ============ BANNERS LOGIC ============

export const getAllBanners = async () => {
  try {
    const snapshot = await adminFirestore
      .collection("sliders")
      .orderBy("createdAt", "desc")
      .get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (e) {
    console.error("Error getting banners:", e);
    throw e;
  }
};

export const addABanner = async (data: any) => {
  try {
    const docRef = await adminFirestore.collection("sliders").add({
      ...data,
      createdAt: new Date(),
    });
    return { id: docRef.id, ...data };
  } catch (e) {
    console.error("Error adding banner:", e);
    throw e;
  }
};
export const deleteBanner = async (id: string) => {
  try {
    const doc = await adminFirestore.collection("sliders").doc(id).get();
    if (doc.exists) {
      const data = doc.data();
      if (data?.url) {
        try {
          // Extract path from storage URL: https://storage.googleapis.com/BUCKET_NAME/PATH
          const urlParts = data.url.split("/");
          const path = urlParts.slice(4).join("/"); // Everything after bucket name
          if (path) {
            await adminStorageBucket.file(path).delete().catch(err => console.error("Storage delete err:", err));
          }
        } catch (storageErr) {
          console.error("Error extracting/deleting storage file:", storageErr);
        }
      }
    }
    await adminFirestore.collection("sliders").doc(id).delete();
    return { id };
  } catch (e) {
    console.error("Error deleting banner:", e);
    throw e;
  }
};
