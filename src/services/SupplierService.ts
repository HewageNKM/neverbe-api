import { adminFirestore } from "@/firebase/firebaseAdmin";
import { Supplier } from "@/model/Supplier";
import { FieldValue } from "firebase-admin/firestore";
import { nanoid } from "nanoid";

const COLLECTION = "suppliers";

/**
 * Get all suppliers
 */
export const getSuppliers = async (status?: boolean): Promise<Supplier[]> => {
  try {
    let query: FirebaseFirestore.Query = adminFirestore
      .collection(COLLECTION)
      .where("isDeleted", "==", false);

    if (typeof status === "boolean") {
      query = query.where("status", "==", status);
    }

    const snapshot = await query.get();
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Supplier[];
  } catch (error) {
    console.error("[SupplierService] Error fetching suppliers:", error);
    throw error;
  }
};

/**
 * Get supplier by ID
 */
import { AppError } from "@/utils/apiResponse";

// ... (previous)

/**
 * Get supplier by ID
 */
export const getSupplierById = async (id: string): Promise<Supplier> => {
  try {
    const doc = await adminFirestore.collection(COLLECTION).doc(id).get();
    if (!doc.exists) {
      throw new AppError("Supplier not found", 404);
    }
    return { id: doc.id, ...doc.data() } as Supplier;
  } catch (error) {
    console.error("[SupplierService] Error fetching supplier:", error);
    throw error;
  }
};

/**
 * Create supplier
 */
export const createSupplier = async (
  data: Omit<Supplier, "id" | "createdAt" | "updatedAt">
): Promise<Supplier> => {
  try {
    const id = `sup-${nanoid(8)}`;
    const now = FieldValue.serverTimestamp();

    const newSupplier = {
      ...data,
      id,
      status: true,
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    };

    await adminFirestore.collection(COLLECTION).doc(id).set(newSupplier);

    return newSupplier as unknown as Supplier;
  } catch (error) {
    console.error("[SupplierService] Error creating supplier:", error);
    throw error;
  }
};

/**
 * Update supplier
 */
export const updateSupplier = async (
  id: string,
  updates: Partial<Supplier>
): Promise<Supplier> => {
  try {
    const docRef = adminFirestore.collection(COLLECTION).doc(id);
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      throw new AppError("Supplier not found", 404);
    }

    const updateData = { ...updates };
    delete (updateData as any).id;
    delete (updateData as any).createdAt;

    await docRef.update({
      ...updateData,
      updatedAt: FieldValue.serverTimestamp(),
    });

    const updated = await getSupplierById(id);
    // getSupplierById now throws, so strictly no null check needed if we trust it,
    // but TS might want a return.
    return updated;
  } catch (error) {
    console.error("[SupplierService] Error updating supplier:", error);
    throw error;
  }
};

/**
 * Delete supplier (soft delete by setting status to inactive)
 */
export const deleteSupplier = async (id: string): Promise<void> => {
  try {
    const docRef = adminFirestore.collection(COLLECTION).doc(id);
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      throw new AppError("Supplier not found", 404);
    }

    await docRef.update({
      isDeleted: true,
      status: false,
      updatedAt: FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error("[SupplierService] Error deleting supplier:", error);
    throw error;
  }
};

/**
 * Get suppliers dropdown list
 */
export const getSuppliersDropdown = async (): Promise<
  { id: string; label: string }[]
> => {
  try {
    const snapshot = await adminFirestore
      .collection(COLLECTION)
      .where("isDeleted", "==", false)
      .where("status", "==", true)
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      label: doc.data().name,
    }));
  } catch (error) {
    console.error(
      "[SupplierService] Error fetching suppliers dropdown:",
      error
    );
    throw error;
  }
};
