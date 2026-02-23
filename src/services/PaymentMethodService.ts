import { adminFirestore } from "@/firebase/firebaseAdmin";
import { PaymentMethod } from "@/model/PaymentMethod";
import { AppError } from "@/utils/apiResponse";

const COLLECTION = "payment_methods";

/**
 * Get all payment methods
 */
export const getPaymentMethods = async (): Promise<PaymentMethod[]> => {
  try {
    const snapshot = await adminFirestore
      .collection(COLLECTION)
      .where("isDeleted", "==", false)
      .get();
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as PaymentMethod[];
  } catch (error) {
    console.error("[PaymentMethodService] Error fetching methods:", error);
    throw error;
  }
};

/**
 * Get payment method by ID
 */
export const getPaymentMethodById = async (
  id: string
): Promise<PaymentMethod> => {
  try {
    const doc = await adminFirestore
      .collection(COLLECTION)
      .where("isDeleted", "==", false)
      .where("id", "==", id)
      .limit(1)
      .get();
    if (!doc.docs.length) {
      throw new AppError(`Payment Method with ID ${id} not found`, 404);
    }
    return { id: doc.docs[0].id, ...doc.docs[0].data() } as PaymentMethod;
  } catch (error) {
    console.error("[PaymentMethodService] Error fetching method:", error);
    throw error;
  }
};

/**
 * Create new payment method
 */
export const createPaymentMethod = async (
  data: Omit<PaymentMethod, "id" | "createdAt" | "updatedAt" | "isDeleted">
): Promise<PaymentMethod> => {
  try {
    const newDocRef = adminFirestore.collection(COLLECTION).doc();
    const newMethod: PaymentMethod = {
      id: newDocRef.id,
      ...data,
      isDeleted: false,
      createdAt: new Date() as any,
      updatedAt: new Date() as any,
    };

    // Fix: Ensure we don't save 'id' field twice if not needed, but model implies it's part of object.
    // Firestore set/create will save it as a field.
    await newDocRef.set(newMethod);

    return newMethod;
  } catch (error) {
    console.error("[PaymentMethodService] Error creating method:", error);
    throw error;
  }
};

/**
 * Update payment method
 */
export const updatePaymentMethod = async (
  id: string,
  updates: Partial<PaymentMethod>
): Promise<void> => {
  try {
    const docRef = adminFirestore.collection(COLLECTION).doc(id);
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      throw new AppError(`Payment Method with ID ${id} not found`, 404);
    }

    await docRef.update({
      ...updates,
      updatedAt: new Date() as any,
    });
  } catch (error) {
    console.error("[PaymentMethodService] Error updating method:", error);
    throw error;
  }
};

/**
 * Delete payment method (Soft Delete)
 */
export const deletePaymentMethod = async (id: string): Promise<void> => {
  try {
    // Check existence
    const docRef = adminFirestore.collection(COLLECTION).doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
      throw new AppError(`Payment Method with ID ${id} not found`, 404);
    }

    await docRef.update({
      isDeleted: true,
      updatedAt: new Date() as any,
    });
  } catch (error) {
    console.error("[PaymentMethodService] Error deleting method:", error);
    throw error;
  }
};
