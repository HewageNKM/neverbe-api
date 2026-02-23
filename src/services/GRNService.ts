import { adminFirestore } from "@/firebase/firebaseAdmin";
import { GRN, GRNItem } from "@/model/GRN";
import { FieldValue } from "firebase-admin/firestore";
import {
  getPurchaseOrderById,
  updateReceivedQuantities,
} from "./PurchaseOrderService";
import { AppError } from "@/utils/apiResponse";

const COLLECTION = "grn";
const INVENTORY_COLLECTION = "stock_inventory";

/**
 * Generate next GRN number
 */
const generateGRNNumber = async (): Promise<string> => {
  const today = new Date();
  const prefix = `GRN-${today.getFullYear()}${String(
    today.getMonth() + 1
  ).padStart(2, "0")}`;

  const snapshot = await adminFirestore
    .collection(COLLECTION)
    .where("grnNumber", ">=", prefix)
    .where("grnNumber", "<", prefix + "\uf8ff")
    .limit(1)
    .get();

  let sequence = 1;
  if (!snapshot.empty) {
    const lastGRN = snapshot.docs[0].data().grnNumber;
    const lastSeq = parseInt(lastGRN.split("-").pop() || "0", 10);
    sequence = lastSeq + 1;
  }

  return `${prefix}-${String(sequence).padStart(4, "0")}`;
};

/**
 * Get all GRNs
 */
export const getGRNs = async (purchaseOrderId?: string): Promise<GRN[]> => {
  try {
    let query: FirebaseFirestore.Query = adminFirestore.collection(COLLECTION);

    if (purchaseOrderId) {
      query = query.where("purchaseOrderId", "==", purchaseOrderId);
    }

    const snapshot = await query.get();
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as GRN[];
  } catch (error) {
    console.error("[GRNService] Error fetching GRNs:", error);
    throw error;
  }
};

/**
 * Get GRN by ID
 */
export const getGRNById = async (id: string): Promise<GRN> => {
  try {
    const doc = await adminFirestore.collection(COLLECTION).doc(id).get();
    if (!doc.exists) {
      throw new AppError(`GRN with ID ${id} not found`, 404);
    }
    return { id: doc.id, ...doc.data() } as GRN;
  } catch (error) {
    console.error("[GRNService] Error fetching GRN:", error);
    throw error;
  }
};

/**
 * Create GRN and update inventory
 */
export const createGRN = async (
  grn: Omit<
    GRN,
    "id" | "grnNumber" | "inventoryUpdated" | "createdAt" | "updatedAt"
  >
): Promise<GRN> => {
  try {
    // Validate PO exists
    const po = await getPurchaseOrderById(grn.purchaseOrderId);
    // getPurchaseOrderById now throws 404 if not found, so no explicit check needed here unless it returns null?
    // In PurchaseOrderService.ts, I updated it to throw AppError(404).
    // So 'const po' will be valid.

    const grnNumber = await generateGRNNumber();

    // Calculate total
    const totalAmount = grn.items.reduce(
      (sum, item) => sum + item.totalCost,
      0
    );

    // Create GRN document
    const docRef = await adminFirestore.collection(COLLECTION).add({
      ...grn,
      grnNumber,
      totalAmount,
      inventoryUpdated: false,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Update inventory quantities
    await updateInventoryFromGRN(grn.items);

    // Mark GRN as inventory updated
    await docRef.update({ inventoryUpdated: true });

    // Update PO received quantities
    await updateReceivedQuantities(
      grn.purchaseOrderId,
      grn.items.map((item) => ({
        productId: item.productId,
        variantId: item.variantId,
        size: item.size,
        quantity: item.receivedQuantity,
      }))
    );

    return {
      id: docRef.id,
      ...grn,
      grnNumber,
      totalAmount,
      inventoryUpdated: true,
    };
  } catch (error) {
    console.error("[GRNService] Error creating GRN:", error);
    throw error;
  }
};

/**
 * Update inventory quantities from GRN items
 */
const updateInventoryFromGRN = async (items: GRNItem[]): Promise<void> => {
  const batch = adminFirestore.batch();

  /* Use plain object to avoid iteration issues */
  const productUpdates: Record<string, number> = {};

  for (const item of items) {
    if (item.receivedQuantity <= 0) continue;

    // Query for existing inventory entry
    const inventoryQuery = await adminFirestore
      .collection(INVENTORY_COLLECTION)
      .where("productId", "==", item.productId)
      .where("size", "==", item.size)
      .where("stockId", "==", item.stockId)
      .limit(1)
      .get();

    if (!inventoryQuery.empty) {
      // Update existing inventory
      const inventoryDoc = inventoryQuery.docs[0];
      const currentQty = inventoryDoc.data().quantity || 0;
      batch.update(inventoryDoc.ref, {
        quantity: currentQty + item.receivedQuantity,
        updatedAt: FieldValue.serverTimestamp(),
      });
    } else {
      // Create new inventory entry
      const newInventoryRef = adminFirestore
        .collection(INVENTORY_COLLECTION)
        .doc();
      batch.set(newInventoryRef, {
        productId: item.productId,
        variantId: item.variantId || null,
        size: item.size,
        stockId: item.stockId,
        quantity: item.receivedQuantity,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    // Accumulate product updates
    const current = productUpdates[item.productId] || 0;
    productUpdates[item.productId] = current + item.receivedQuantity;
  }

  // Batch update products totalStock
  for (const [productId, change] of Object.entries(productUpdates)) {
    const productRef = adminFirestore.collection("products").doc(productId);
    batch.update(productRef, {
      totalStock: FieldValue.increment(change),
      inStock: true, // Since we are adding stock
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  await batch.commit();
  console.log(
    `[GRNService] Updated inventory and product totals for ${items.length} items`
  );
};

/**
 * Get GRNs for a specific supplier
 */
export const getGRNsBySupplierId = async (
  supplierId: string
): Promise<GRN[]> => {
  try {
    const snapshot = await adminFirestore
      .collection(COLLECTION)
      .where("supplierId", "==", supplierId)
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as GRN[];
  } catch (error) {
    console.error("[GRNService] Error fetching GRNs by supplier:", error);
    throw error;
  }
};
