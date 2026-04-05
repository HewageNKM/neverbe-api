import { BaseRepository } from "./BaseRepository";
import type { Promotion } from "@/interfaces";

/**
 * Promotion Repository - handles promotion data access
 */
export class PromotionRepository extends BaseRepository<Promotion> {
  constructor() {
    super("promotions");
  }

  /**
   * Serialize promotion for client
   */
  private serializePromotion(
    doc: FirebaseFirestore.DocumentSnapshot,
  ): Promotion {
    const data = doc.data()!;
    return {
      id: doc.id,
      ...data,
      startDate: this.serializeTimestamp(data.startDate),
      endDate: this.serializeTimestamp(data.endDate),
      createdAt: this.serializeTimestamp(data.createdAt),
      updatedAt: this.serializeTimestamp(data.updatedAt),
    } as Promotion;
  }

  /**
   * Find all active promotions (within date range)
   */
  async findActive(): Promise<Promotion[]> {
    const now = new Date();

    // Fetch all promotions and filter in-memory to avoid index issues
    // and handle missing fields (e.g., missing isActive or isDeleted) safely
    const snapshot = await this.collection.get();

    return snapshot.docs
      .map((doc) => this.serializePromotion(doc))
      .filter((promo) => {
        // 1. Status Check (support both legacy `status` and `isActive` boolean)
        const isStatusActive = promo.status === "ACTIVE" || promo.status === undefined;
        const isBoolActive = promo.isActive === true || promo.isActive === undefined;
        
        // If explicitly inactive via either field, filter out
        if (promo.status === "INACTIVE" || promo.isActive === false) return false;
        
        // Ensure not marked as deleted
        if (promo.isDeleted === true) return false;

        // 2. Date Check
        const startDate = promo.startDate
          ? new Date(promo.startDate as string)
          : null;
        const endDate = promo.endDate
          ? new Date(promo.endDate as string)
          : null;
          
        if (startDate && now < startDate) return false;
        if (endDate && now > endDate) return false;
        
        return true;
      });
  }

  /**
   * Find promotion by ID
   */
  async findById(id: string): Promise<Promotion | null> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return null;

    const promo = this.serializePromotion(doc);
    if ((promo as any).isDeleted) return null;

    return promo;
  }

  /**
   * Find all promotions
   */
  async findAll(): Promise<Promotion[]> {
    const snapshot = await this.collection.where("isDeleted", "!=", true).get();
    return snapshot.docs.map((doc) => this.serializePromotion(doc));
  }

  /**
   * Create a new promotion
   */
  async create(data: Partial<Promotion>): Promise<Promotion> {
    const docRef = await this.collection.add({
      ...data,
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const doc = await docRef.get();
    return this.serializePromotion(doc);
  }

  /**
   * Update an existing promotion
   */
  async update(id: string, data: Partial<Promotion>): Promise<Promotion> {
    await this.collection.doc(id).update({
      ...data,
      updatedAt: new Date(),
    });
    const doc = await this.collection.doc(id).get();
    return this.serializePromotion(doc);
  }

  /**
   * Delete a promotion (soft delete)
   */
  async delete(id: string): Promise<void> {
    await this.collection.doc(id).update({
      isDeleted: true,
      updatedAt: new Date(),
    });
  }
}

// Singleton instance
export const promotionRepository = new PromotionRepository();
