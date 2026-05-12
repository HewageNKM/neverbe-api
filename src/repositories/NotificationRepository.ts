import { BaseRepository } from "./BaseRepository";

/**
 * Notification Repository - handles OTPs, templates, and logs
 */
export class NotificationRepository extends BaseRepository<any> {
  constructor() {
    super("notifications_sent");
  }

  /**
   * OTP Methods
   */
  async findLatestOTP(phone: string): Promise<any | null> {
    const snapshot = await this.collection.firestore.collection("otp_verifications")
      .where("phone", "==", phone)
      .orderBy("createdAt", "desc")
      .limit(1)
      .get();
    return snapshot.empty ? null : { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
  }

  async createOTP(data: any): Promise<void> {
    await this.collection.firestore.collection("otp_verifications").add(data);
  }

  async updateOTP(id: string, data: any): Promise<void> {
    await this.collection.firestore.collection("otp_verifications").doc(id).update(data);
  }

  async findRecentVerifiedOTP(phone: string, cutoffDate: Date): Promise<any | null> {
    const snapshot = await this.collection.firestore.collection("otp_verifications")
      .where("phone", "==", phone)
      .where("verified", "==", true)
      .where("verifiedAt", ">=", cutoffDate)
      .orderBy("verifiedAt", "desc")
      .limit(1)
      .get();
    return snapshot.empty ? null : snapshot.docs[0].data();
  }

  /**
   * Template Methods moved to SettingsRepository
   */

  /**
   * Tracker Methods
   */
  async findSentNotification(orderId: string, hashValue: string, type: string): Promise<boolean> {
    const snapshot = await this.collection
      .where("orderId", "==", orderId)
      .where("hashValue", "==", hashValue)
      .where("type", "==", type)
      .get();
    return !snapshot.empty;
  }

  async logNotification(data: any): Promise<void> {
    await this.collection.add({ ...data, createdAt: new Date() });
  }

  async findLogsForOrder(orderId: string): Promise<any[]> {
    const snapshot = await this.collection
      .where("orderId", "==", orderId)
      .get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async findAllLogs(options: { page: number; pageSize: number; search?: string }): Promise<{ logs: any[]; total: number }> {
    const { page, pageSize, search } = options;
    let query = this.collection as FirebaseFirestore.Query;

    if (search) {
      const isEmail = search.includes("@");
      const isPhone = /^\+?\d+$/.test(search);
      if (isEmail || isPhone) query = query.where("to", "==", search.trim());
      else query = query.where("orderId", "==", search.trim().toUpperCase());
    }

    const total = (await query.count().get()).data().count;
    const snapshot = await query
      .orderBy("createdAt", "desc")
      .offset((page - 1) * pageSize)
      .limit(pageSize)
      .get();

    const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { logs, total };
  }

  /**
   * Mail Methods (for Trigger Email extension)
   */
  async queueEmail(payload: any): Promise<void> {
    await this.collection.firestore.collection("mail").add(payload);
  }

  /**
   * ERP Notifications
   */
  async createAdminNotification(docId: string, data: any): Promise<void> {
    await this.collection.firestore.collection("erp_notifications").doc(docId).set(data);
  }

  async getAdminNotifications(limit: number = 20): Promise<any[]> {
    const snapshot = await this.collection.firestore
      .collection("erp_notifications")
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  }

  async markNotificationsAsRead(id?: string, all: boolean = false): Promise<void> {
    const coll = this.collection.firestore.collection("erp_notifications");

    if (all) {
      const unread = await coll.where("read", "==", false).get();
      const batch = this.collection.firestore.batch();
      unread.docs.forEach((doc) => {
        batch.update(doc.ref, { read: true });
      });
      await batch.commit();
    } else if (id) {
      await coll.doc(id).update({ read: true });
    }
  }
}

export const notificationRepository = new NotificationRepository();
