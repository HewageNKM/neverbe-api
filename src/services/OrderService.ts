import { adminFirestore } from "@/firebase/firebaseAdmin";
import admin from "firebase-admin";
import { Order } from "@/model/Order";
import {
  updateOrAddOrderHash,
  validateDocumentIntegrity,
} from "./IntegrityService";
import { FieldValue } from "firebase-admin/firestore";
import { AppError } from "@/utils/apiResponse";
import { 
  sendOrderStatusUpdateSMS, 
  sendOrderStatusUpdateEmail 
} from "./NotificationService";

import { toSafeLocaleString } from "./UtilService";

const ORDERS_COLLECTION = "orders";

export const getOrders = async (
  page: number = 1,
  size: number = 20,
  startDateStr?: string,
  endDateStr?: string,
  status?: string,
  payment?: string,
  orderId?: string,
  from?: string,
  stockId?: string,
  paymentMethod?: string,
) => {
  try {
    let query: any = adminFirestore.collection(ORDERS_COLLECTION);

    if (startDateStr && endDateStr) {
      const startDate = new Date(startDateStr);
      const endDate = new Date(endDateStr);
      endDate.setHours(23, 59, 59, 999);
      query = query.where("createdAt", ">=", startDate).where("createdAt", "<=", endDate);
    }

    if (status) query = query.where("status", "==", status);
    if (payment) query = query.where("paymentStatus", "==", payment);
    if (from) query = query.where("from", "==", from);
    if (stockId) query = query.where("stockId", "==", stockId);
    if (paymentMethod) query = query.where("paymentMethod", "==", paymentMethod);

    if (orderId) {
      query = query.where("orderId", "==", orderId);
    }

    const countSnapshot = await query.count().get();
    const nbHits = countSnapshot.data().count;

    const fetchAllMode = !orderId && !startDateStr && !endDateStr;
    const fetchLimit = fetchAllMode ? 1000 : size;

    const snapshot = await query.orderBy("createdAt", "desc").offset((page - 1) * fetchLimit).limit(fetchLimit).get();
    
    const orders: Order[] = [];
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const integrityResult = await validateDocumentIntegrity(ORDERS_COLLECTION, doc.id);
      const order: Order = {
        ...data,
        userId: data.userId || null, 
        orderId: doc.id,
        integrity: integrityResult,
        customer: data.customer ? { ...data.customer } : null,
      } as unknown as Order;
      orders.push(order);
    }

    console.log(`Fetched ${orders.length} orders from Firestore, returning page ${page}`);
    return {
      dataList: orders,
      total: nbHits,
    };
  } catch (error: any) {
    console.error(error);
    throw error;
  }
};

export const getOrder = async (orderId: string): Promise<Order> => {
  try {
    // 1. Changed query to a direct doc.get() for efficiency and consistency
    const doc = await adminFirestore
      .collection(ORDERS_COLLECTION)
      .doc(orderId)
      .get();

    if (!doc.exists) {
      throw new AppError(`Order with ID ${orderId} not found`, 404);
    }

    const data = doc.data() as Order;

    // 2. Passed 'adminFirestore' and used the doc.id for the check
    const integrity = await validateDocumentIntegrity(
      ORDERS_COLLECTION,
      doc.id,
    );

    return {
      ...data,
      orderId: doc.id, // 3. Ensure orderId is the doc ID
      integrity: integrity, // 4. Add integrity result
      customer: data.customer
        ? {
            ...data.customer,
            updatedAt: data.customer.updatedAt
              ? toSafeLocaleString(data.customer.updatedAt)
              : null,
          }
        : null,
      createdAt: toSafeLocaleString(data.createdAt),
      updatedAt: toSafeLocaleString(data.updatedAt),
      restockedAt: data.restockedAt
        ? toSafeLocaleString(data.restockedAt)
        : null,
    };
  } catch (error) {
    console.error("Error fetching order:", error);
    throw error;
  }
};

export const updateOrder = async (order: Order & { sendNotification?: boolean }, orderId: string) => {
  try {
    const orderRef = adminFirestore.collection(ORDERS_COLLECTION).doc(orderId);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists)
      throw new AppError(`Order with ID ${orderId} not found`, 404);

    const existingOrder = orderDoc.data() as Order;

    if (existingOrder.paymentStatus?.toLowerCase() === "refunded") {
      throw new AppError(
        `Order with ID ${orderId} is already refunded can't proceed with update`,
        400,
      );
    }

    // 🧾 Update Firestore order
    const orderUpdate: any = {
      paymentStatus: order.paymentStatus,
      status: order.status,
      updatedAt: FieldValue.serverTimestamp(),
      ...(order.customer && {
        customer: {
          ...order.customer,
          updatedAt: FieldValue.serverTimestamp(),
          createdAt: FieldValue.serverTimestamp(),
        },
      }),
    };

    if (order.trackingNumber !== undefined) orderUpdate.trackingNumber = order.trackingNumber;
    if (order.courier !== undefined) orderUpdate.courier = order.courier;

    await orderRef.set(orderUpdate, { merge: true });


    // ✅ Fetch the final updated data
    const updatedOrderDoc = await orderRef.get();
    const updatedOrderData = updatedOrderDoc.data();

    if (!updatedOrderData) {
      throw new AppError(
        `Order with ID ${orderId} not found after update`,
        404,
      );
    }

    // 🔒 Update or add hash ledger entry
    await updateOrAddOrderHash(updatedOrderData);

    // 🔔 Unified Customer Notifications
    // Only trigger if status changed, it's a notification-eligible status, AND the user requested it via sendNotification flag.
    const oldStatus = existingOrder.status?.toUpperCase();
    const newStatus = order.status?.toUpperCase();
    const shouldNotify = order.sendNotification === true;

    if (shouldNotify && newStatus && oldStatus !== newStatus) {
      const triggerStatuses = ["PROCESSING", "COMPLETED", "CANCELLED"];
      if (triggerStatuses.includes(newStatus)) {
        console.log(`[Order Service] Triggering consolidated notification for ${orderId} (${newStatus})`);
        
        // Concurrent notification delivery
        Promise.all([
          sendOrderStatusUpdateSMS(orderId, newStatus),
          sendOrderStatusUpdateEmail(orderId, newStatus)
        ]).catch(err => console.error(`[Order Service] Unified notification failure for ${orderId}:`, err));
      }
    }

    console.log(`✅ Order with ID ${orderId} updated and hashed successfully`);
  } catch (error) {
    console.error("❌ Error updating order:", error);
    throw error;
  }
};

export const addOrder = async (order: Partial<Order>) => {
  if (!order.from) throw new AppError("Order source (from) is required", 400);
  const fromSource = order.from.toLowerCase();

  // --- POS DELEGATION ---
  if (fromSource === "store") {
    const { createPOSOrder } = await import("./POSService");
    return await createPOSOrder(order, order.userId || "anonymous");
  }

  // --- WEBSITE DELEGATION (Isolated Route handles this now, but keeping for compatibility) ---
  if (fromSource === "website") {
    const { addWebOrder } = await import("./WebOrderService");
    return await addWebOrder(order);
  }

  // --- ERP / OTHER SOURCES (Original simplified logic) ---
  if (!order.orderId) throw new AppError("Order ID is required", 400);

  const orderRef = adminFirestore.collection("orders").doc(order.orderId);
  const now = admin.firestore.Timestamp.now();
  const orderData: Order = {
    ...order,
    userId: order.userId || null,
    createdAt: now,
    updatedAt: now,
  } as Order;

  try {
    await orderRef.set(orderData);

    // Integrity Update
    const { updateOrAddOrderHash } = await import("./IntegrityService");
    await updateOrAddOrderHash(orderData);

    console.log(`✅ ERP/Other order ${order.orderId} created`);
  } catch (error) {
    console.error("❌ addOrder failed:", error);
    throw error;
  }
};
