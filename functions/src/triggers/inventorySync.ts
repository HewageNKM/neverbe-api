import { onDocumentWritten } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";

/**
 * Automatically synchronizes global product stock count whenever an inventory record changes.
 * 
 * Rules:
 * 1. Global product 'totalStock' is the sum of all inventory locations, clamped at a minimum of 0.
 * 2. 'inStock' is true if the actual sum is greater than 0.
 * 3. Individual inventory records (real stock) can go negative (e.g., for POS sales).
 */
export const syncProductStock = onDocumentWritten("stock_inventory/{inventoryId}", async (event) => {
  const afterData = event.data?.after.data();
  const beforeData = event.data?.before.data();
  
  // Identify the product ID from either the new or old document
  const productId = afterData?.productId || beforeData?.productId;
  if (!productId) {
    console.warn("[Sync] No productId found in inventory record change.");
    return;
  }

  const db = admin.firestore();
  
  try {
    // 1. Fetch all inventory records for this product across all locations
    const inventorySnaps = await db
      .collection("stock_inventory")
      .where("productId", "==", productId)
      .get();

    let actualSum = 0;
    inventorySnaps.forEach((doc) => {
      const data = doc.data();
      actualSum += Number(data.quantity || 0);
    });

    // 2. Rule: Global totalStock stops at 0 (clamped)
    const totalStock = Math.max(0, actualSum);
    
    // 3. Rule: inStock is only true if there is actual positive quantity
    const inStock = actualSum > 0;

    // 4. Update the parent product document
    await db.collection("products").doc(productId).update({
      totalStock,
      inStock,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`[Sync] Product ${productId} synchronized: totalStock=${totalStock}, inStock=${inStock} (Actual Sum: ${actualSum})`);
  } catch (error) {
    console.error(`[Sync] Error synchronizing stock for product ${productId}:`, error);
  }
});
