import { adminFirestore } from "@/firebase/firebaseAdmin";
import { ShippingRule } from "@/model/ShippingRule";
import { FieldValue } from "firebase-admin/firestore";
import { AppError } from "@/utils/apiResponse";
import { nanoid } from "nanoid";

const COLLECTION = "shipping_rules";

export const getShippingRules = async () => {
  try {
    const snapshot = await adminFirestore.collection(COLLECTION).get();
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
      updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt,
    }));
  } catch (error) {
    console.error("Error fetching shipping rules:", error);
    throw error;
  }
};

export const createShippingRule = async (data: Partial<ShippingRule>) => {
  try {
    const newRule = {
      ...data,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };
    const id = `sr-${nanoid(8)}`;
    await adminFirestore.collection(COLLECTION).doc(id).set(newRule);
    return id;
  } catch (error) {
    console.error("Error creating shipping rule:", error);
    throw error;
  }
};

export const updateShippingRule = async (
  id: string,
  data: Partial<ShippingRule>,
) => {
  try {
    const docRef = adminFirestore.collection(COLLECTION).doc(id);
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      throw new AppError(`Shipping rule with ID ${id} not found`, 404);
    }

    const updateData = {
      ...data,
      updatedAt: FieldValue.serverTimestamp(),
    };
    // Ensure ID is not in the data payload for update
    delete (updateData as any).id;

    await docRef.update(updateData);
    return id;
  } catch (error) {
    console.error("Error updating shipping rule:", error);
    throw error;
  }
};

export const deleteShippingRule = async (id: string) => {
  try {
    const docRef = adminFirestore.collection(COLLECTION).doc(id);
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      throw new AppError(`Shipping rule with ID ${id} not found`, 404);
    }
    await docRef.delete();
    return id;
  } catch (error) {
    console.error("Error deleting shipping rule:", error);
    throw error;
  }
};
