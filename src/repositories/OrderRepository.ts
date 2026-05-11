import { BaseRepository } from "./BaseRepository";
import { FieldValue } from "firebase-admin/firestore";
import type { Order } from "@/interfaces";
import { formatInTimeZone } from "date-fns-tz";

/**
 * Order Repository - handles order data access
 */
export class OrderRepository extends BaseRepository<Order> {
  constructor() {
    super("orders");
  }

  /**
   * Format timestamp to locale string
   */
  private toLocaleString(val: any): string | null {
    if (!val) return null;
    try {
      // Handle Firestore Timestamps and various other date formats
      let date: Date;
      if (typeof val.toDate === "function") {
        date = val.toDate();
      } else if (val instanceof Date) {
        date = val;
      } else if (val && typeof val === "object" && "_seconds" in val) {
        // Handle raw Firestore timestamp objects if they aren't converted to admin.Timestamp instances
        date = new Date(val._seconds * 1000);
      } else {
        date = new Date(val);
      }

      if (isNaN(date.getTime())) return null;
      return formatInTimeZone(date, "Asia/Colombo", "dd/MM/yyyy, hh:mm:ss a");
    } catch (e) {
      console.error("[OrderRepository] timestamp conversion error:", e);
      return null;
    }
  }

  /**
   * Find order by orderId for invoice
   */
  async findByOrderId(orderId: string): Promise<Order | null> {
    const snapshot = await this.collection
      .where("orderId", "==", orderId)
      .limit(1)
      .get();

    if (snapshot.empty) return null;

    const order = snapshot.docs[0].data() as Order;

    // Safely get date for expiry check
    let createdAtDate: Date;
    if (order.createdAt && typeof (order.createdAt as any).toDate === "function") {
      createdAtDate = (order.createdAt as any).toDate();
    } else if (order.createdAt && (order.createdAt as any)._seconds) {
      createdAtDate = new Date((order.createdAt as any)._seconds * 1000);
    } else {
      createdAtDate = new Date();
    }

    const diffDays =
      (Date.now() - createdAtDate.getTime()) / (1000 * 60 * 60 * 24);
    const expired = diffDays > 30;

    return {
      ...order,
      createdAt: this.toLocaleString(order.createdAt),
      updatedAt: this.toLocaleString(order.updatedAt),
      expired,
      customer: order.customer ? {
        ...order.customer,
        createdAt: this.toLocaleString(order.customer.createdAt),
        updatedAt: this.toLocaleString(order.customer.updatedAt),
      } : null,
    } as any;
  }

  /**
   * Update order payment status
   */
  async updatePaymentStatus(
    docId: string,
    paymentId: string,
    status: string,
  ): Promise<Order> {
    await this.collection.doc(docId).update({
      paymentId,
      paymentStatus: status,
      updatedAt: FieldValue.serverTimestamp(),
    });

    const doc = await this.collection.doc(docId).get();
    return doc.data() as Order;
  }

  /**
   * Find order document ID by orderId
   */
  async findDocIdByOrderId(orderId: string): Promise<string | null> {
    const snapshot = await this.collection
      .where("orderId", "==", orderId)
      .limit(1)
      .get();

    if (snapshot.empty) return null;
    return snapshot.docs[0].id;
  }

  /**
   * Check if user has any completed orders
   */
  async hasCompletedOrders(userId: string): Promise<boolean> {
    const snapshot = await this.collection
      .where("userId", "==", userId)
      .where("status", "!=", "CANCELLED")
      .limit(1)
      .get();

    return !snapshot.empty;
  }

  /**
   * Get recent orders for a user
   */
  async findByUserId(userId: string, limit: number = 10): Promise<Order[]> {
    const snapshot = await this.collection
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .where("from", "==", "Website")
      .limit(limit)
      .get();

    return snapshot.docs.map((doc) => ({
      ...(doc.data() as Order),
      createdAt: this.toLocaleString(doc.data().createdAt),
      updatedAt: this.toLocaleString(doc.data().updatedAt),
    }));
  }

  /**
   * Count orders by item (for hot products calculation)
   */
  async countOrdersByItem(
    limit: number = 100,
  ): Promise<Record<string, number>> {
    const snapshot = await this.collection.limit(limit).get();
    const itemCount: Record<string, number> = {};

    snapshot.forEach((doc) => {
      const order = doc.data();
      if (Array.isArray(order.items)) {
        order.items.forEach((item: any) => {
          if (item?.itemId) {
            itemCount[item.itemId] = (itemCount[item.itemId] || 0) + 1;
          }
        });
      }
    });

    return itemCount;
  }

  /**
   * Find paid orders within a date range
   */
  async findPaidOrdersInDateRange(
    start: Date,
    end: Date
  ): Promise<Order[]> {
    const snapshot = await this.collection
      .where("paymentStatus", "==", "Paid")
      .where("createdAt", ">=", start)
      .where("createdAt", "<=", end)
      .get();

    return snapshot.docs.map(doc => doc.data() as Order);
  }

  /**
   * Find orders within a date range by status
   */
  async findByStatusInDateRange(
    start: Date,
    end: Date,
    statusList: string[] = ["Paid", "PAID"]
  ): Promise<Order[]> {
    const snapshot = await this.collection
      .where("createdAt", ">=", start)
      .where("createdAt", "<=", end)
      .where("paymentStatus", "in", statusList)
      .get();

    return snapshot.docs.map(doc => doc.data() as Order);
  }

  /**
   * Get recent orders with limit
   */
  async findRecent(limit: number): Promise<Order[]> {
    const snapshot = await this.collection
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();

    return snapshot.docs.map(doc => doc.data() as Order);
  }

  /**
   * Find orders for reporting purposes
   */
  async findForReport(options: {
    start: Date;
    end: Date;
    paymentStatus?: string;
    limit?: number;
  }): Promise<Order[]> {
    const { start, end, paymentStatus, limit } = options;
    let query = this.collection
      .where("createdAt", ">=", start)
      .where("createdAt", "<=", end);

    if (paymentStatus && paymentStatus !== "all") {
      if (paymentStatus.toLowerCase() === "paid") {
        query = query.where("paymentStatus", "in", ["Paid", "PAID"]);
      } else {
        query = query.where("paymentStatus", "==", paymentStatus);
      }
    }

    query = query.orderBy("createdAt", "desc");
    if (limit) query = query.limit(limit);

    const snapshot = await query.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
  }

  /**
   * Count by payment status
   */
  async countByPaymentStatus(status: string): Promise<number> {
    const snapshot = await this.collection
      .where("paymentStatus", "==", status)
      .count()
      .get();
    return snapshot.data().count;
  }

  /**
   * Count by order status and payment status
   */
  async countByStatusAndPayment(
    paymentStatus: string,
    orderStatuses: string[]
  ): Promise<number> {
    const snapshot = await this.collection
      .where("paymentStatus", "==", paymentStatus)
      .where("status", "in", orderStatuses)
      .count()
      .get();
    return snapshot.data().count;
  }

  /**
   * Save order with retry logic
   */
  async saveWithRetry(id: string, data: Order, maxAttempts: number = 3): Promise<void> {
    const docRef = this.collection.doc(id);
    const now = FieldValue.serverTimestamp();
    const orderData = { ...data, createdAt: now, updatedAt: now };

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        await docRef.set(orderData);
        return;
      } catch (err: any) {
        if (attempt === maxAttempts) throw err;
        await new Promise(r => setTimeout(r, attempt * 200));
      }
    }
  }

  /**
   * Find paginated orders with filters
   */
  async findPaginated(options: {
    page?: number;
    size?: number;
    startDate?: Date;
    endDate?: Date;
    status?: string;
    paymentStatus?: string;
    orderId?: string;
    from?: string;
    stockId?: string;
    paymentMethod?: string;
  }): Promise<{ dataList: Order[]; total: number }> {
    const { 
      page = 1, 
      size = 20, 
      startDate, 
      endDate, 
      status, 
      paymentStatus, 
      orderId, 
      from, 
      stockId, 
      paymentMethod 
    } = options;

    let query: FirebaseFirestore.Query = this.collection;

    if (startDate && endDate) {
      query = query.where("createdAt", ">=", startDate).where("createdAt", "<=", endDate);
    }
    if (status) query = query.where("status", "==", status);
    if (paymentStatus) query = query.where("paymentStatus", "==", paymentStatus);
    if (from) query = query.where("from", "==", from);
    if (stockId) query = query.where("stockId", "==", stockId);
    if (paymentMethod) query = query.where("paymentMethod", "==", paymentMethod);
    if (orderId) query = query.where("orderId", "==", orderId);

    const total = (await query.count().get()).data().count;
    
    // Default sorting
    query = query.orderBy("createdAt", "desc");

    const snapshot = await query
      .offset((page - 1) * size)
      .limit(size)
      .get();

    return {
      dataList: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any as Order)),
      total
    };
  }

  /**
   * Find Store (POS) order by orderId
   */
  async findStoreOrderByOrderId(orderId: string, stockId?: string): Promise<{ docId: string; data: Order } | null> {
    let query = this.collection
      .where("orderId", "==", orderId)
      .where("from", "==", "Store");

    if (stockId) {
      query = query.where("stockId", "==", stockId);
    }

    const snapshot = await query.limit(1).get();

    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return {
      docId: doc.id,
      data: doc.data() as Order,
    };
  }

  /**
   * Add exchange ID to order with transaction support
   */
  async arrayUnionExchangeId(
    docId: string,
    exchangeId: string,
    tx?: FirebaseFirestore.Transaction | FirebaseFirestore.WriteBatch
  ): Promise<void> {
    await this.update(docId, {
      exchangeIds: FieldValue.arrayUnion(exchangeId),
    } as any, tx);
  }
}

// Singleton instance
export const orderRepository = new OrderRepository();
