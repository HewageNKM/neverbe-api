import * as admin from "firebase-admin";
import { onSchedule } from "firebase-functions/v2/scheduler";
import * as logger from "firebase-functions/logger";

export const cleanupFailedOrders = onSchedule("0 */12 * * *", async (event) => {
  logger.info("Starting cleanup of failed orders...");

  const db = admin.firestore();

  // Calculate the timestamp for 45 minutes ago
  const cutoffTimeMs = Date.now() - 45 * 60 * 1000;
  const cutoffTimestamp = admin.firestore.Timestamp.fromMillis(cutoffTimeMs);

  try {
    // 1. Fetch failing orders older than 45 minutes
    // Note: The order collection will need a composite index on paymentStatus and createdAt
    const ordersSnapshot = await db
      .collection("orders")
      .where("paymentStatus", "==", "Failed")
      .where("createdAt", "<", cutoffTimestamp)
      .get();

    if (ordersSnapshot.empty) {
      logger.info("No failed orders found to clean up.");
      return;
    }

    logger.info(`Found ${ordersSnapshot.size} orders to clean up.`);

    const batchSizeLimit = 500;
    let batch = db.batch();
    let optCount = 0;

    const commitBatchIfNeeded = async () => {
      if (optCount >= batchSizeLimit) {
        await batch.commit();
        batch = db.batch();
        optCount = 0;
        logger.info("Committed an intermediate batch.");
      }
    };

    for (const orderDoc of ordersSnapshot.docs) {
      const order = orderDoc.data();
      const items = order.items || [];
      const orderId = order.orderId || orderDoc.id;
      const stockId = order.stockId;

      // 2. Format the log items
      const logItems = [];

      for (const item of items) {
        // Collect item info for logging exactly as requested
        logItems.push({
          bPrice: item.bPrice || 0,
          discount: item.discount || 0,
          itemId: item.itemId,
          name: item.name,
          price: item.price || 0,
          quantity: item.quantity || 1,
          size: item.size,
          variantId: item.variantId,
          variantName: item.variantName,
        });

        if (!stockId) {
          logger.warn(
            `Order ${orderId} is missing stockId, skipping inventory restore for ${item.name}`,
          );
          continue;
        }

        // 3. Restore inventory quantity
        const inventoryQuery = await db
          .collection("stock_inventory")
          .where("productId", "==", item.itemId)
          .where("variantId", "==", item.variantId)
          .where("size", "==", item.size)
          .where("stockId", "==", stockId)
          .limit(1)
          .get();

        if (!inventoryQuery.empty) {
          const inventoryDocRef = inventoryQuery.docs[0].ref;
          batch.update(inventoryDocRef, {
            quantity: admin.firestore.FieldValue.increment(item.quantity || 1),
          });
          optCount++;
          await commitBatchIfNeeded();
        } else {
          logger.warn(
            `Could not find inventory document for item: ${item.itemId}, variant: ${item.variantId}, size: ${item.size}, stock: ${stockId}`,
          );
        }

        // 4. Restore product totalStock and inStock status
        const productRef = db.collection("products").doc(item.itemId);
        const productSnap = await productRef.get();
        if (productSnap.exists) {
          const productData = productSnap.data();
          const newTotalStock = Math.max(
            (productData?.totalStock || 0) + (item.quantity || 1),
            0,
          );
          batch.update(productRef, {
            totalStock: newTotalStock,
            inStock: newTotalStock > 0,
          });
          optCount++;
          await commitBatchIfNeeded();
        } else {
          logger.warn(`Could not find product document: ${item.itemId}`);
        }
      }

      // 5. Create cleanup_logs document
      const logRef = db.collection("cleanup_logs").doc();
      batch.set(logRef, {
        type: "order_cleanup",
        items: logItems,
        paymentStatus: "Failed",
        reason: "Failed payment over 45 minutes",
        refId: orderId,
        stockId: stockId || null,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        userId: order.userId || null,
      });
      optCount++;
      await commitBatchIfNeeded();

      // 6. Delete the order
      batch.delete(orderDoc.ref);
      optCount++;
      await commitBatchIfNeeded();

      logger.info(`Processed cleanup for order: ${orderId}`);
    }

    if (optCount > 0) {
      await batch.commit();
      logger.info("Committed the final batch.");
    }

    logger.info("Cleanup of failed orders completed successfully.");
  } catch (error) {
    logger.error("Error during failed orders cleanup:", error);
  }
});
