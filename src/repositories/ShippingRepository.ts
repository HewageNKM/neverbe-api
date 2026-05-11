import { BaseRepository } from "./BaseRepository";

export interface ShippingRule {
  id: string;
  name: string;
  rate: number;
  minWeight: number;
  maxWeight: number;
  isIncremental: boolean;
  baseWeight?: number;
  perKgRate?: number;
  isActive: boolean;
}

export class ShippingRepository extends BaseRepository<ShippingRule> {
  constructor() {
    super("shipping_rules");
  }

  /**
   * Get all active shipping rules
   */
  async getActiveRules(): Promise<ShippingRule[]> {
    const snapshot = await this.collection
      .where("isActive", "==", true)
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ShippingRule));
  }
}

export const shippingRepository = new ShippingRepository();
