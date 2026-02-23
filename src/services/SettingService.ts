import { adminFirestore } from "@/firebase/firebaseAdmin";

const COLLECTION = "app_settings";

export const getERPSettings = async () => {
  try {
    const settingDoc = await adminFirestore
      .collection(COLLECTION)
      .doc("erp_settings")
      .get();
    return settingDoc.data();
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const updateERPSettings = async (data: any) => {
  try {
    await adminFirestore
      .collection(COLLECTION)
      .doc("erp_settings")
      .set(data, { merge: true });
    return { success: true };
  } catch (error) {
    console.log(error);
    throw error;
  }
};
