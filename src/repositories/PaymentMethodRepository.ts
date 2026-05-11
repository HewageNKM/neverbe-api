import { BaseRepository } from "./BaseRepository";

/**
 * PaymentMethod Repository - handles payment method data access
 */
export class PaymentMethodRepository extends BaseRepository<any> {
  constructor() {
    super("payment_methods");
  }

  /**
   * Get all active payment methods
   */
  async findAllActive(): Promise<any[]> {
    const snapshot = await this.collection.where("isDeleted", "==", false).get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  /**
   * Get payment methods for Store/POS
   */
  async findForStore(): Promise<any[]> {
    const snapshot = await this.collection
      .where("isDeleted", "!=", true)
      .where("status", "==", true)
      .where("available", "array-contains", "Store")
      .get();

    return snapshot.docs.map(doc => ({
      paymentId: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
      updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt,
    }));
  }

  /**
   * Get active payment methods for Website
   */
  async findForWebsite(): Promise<any[]> {
    const snapshot = await this.collection
      .where("status", "==", true)
      .where("isDeleted", "==", false)
      .where("available", "array-contains", "Website")
      .get();

    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }
}

export const paymentMethodRepository = new PaymentMethodRepository();
