import { BaseRepository } from "./BaseRepository";
import { ShippingRule } from "@/model/ShippingRule";
import { FieldValue } from "firebase-admin/firestore";

/**
 * Shipping Repository - handles shipping rules
 */
export class ShippingRepository extends BaseRepository<ShippingRule> {
  constructor() {
    super("shipping_rules");
  }

  /**
   * Find all shipping rules
   */
  async findAll(): Promise<ShippingRule[]> {
    const snapshot = await this.collection.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ShippingRule));
  }

  /**
   * Find active shipping rules
   */
  async findActiveRules(): Promise<ShippingRule[]> {
    const snapshot = await this.collection
      .where("isActive", "==", true)
      .get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ShippingRule));
  }
}

/**
 * Settings Repository - handles app-level settings
 */
export class SettingsRepository extends BaseRepository<any> {
  constructor() {
    super("app_settings");
  }

  /**
   * Get ERP settings with ecommerce mapping
   */
  async getErpSettings(): Promise<any> {
    const doc = await this.collection.doc("erp_settings").get();
    if (!doc.exists) return null;

    const data = doc.data();
    const ecommerce = data?.ecommerce || {};
    return {
      ...ecommerce,
      stockId: data?.onlineStockId,
    };
  }

  /**
   * Update ERP settings
   */
  async updateErpSettings(data: any): Promise<void> {
    await this.collection.doc("erp_settings").set(data, { merge: true });
  }

  /**
   * Get ecommerce settings
   */
  async getEcommerceSettings(): Promise<any> {
    const doc = await this.collection.firestore.collection("settings").doc("ecommerce").get();
    return doc.exists ? doc.data() : null;
  }

  /**
   * Update ecommerce settings
   */
  async updateEcommerceSettings(data: any): Promise<void> {
    await this.collection.firestore.collection("settings").doc("ecommerce").set(data, { merge: true });
  }

  /**
   * Get Neural configuration
   */
  async getNeuralConfig(): Promise<any> {
    const doc = await this.collection.doc("neural_config").get();
    const defaultConfig = {
      historicalRunway: 120,
      forecastWindow: 14,
      weightingMode: 'BALANCED',
      lastUpdated: new Date().toISOString()
    };

    if (!doc.exists) return defaultConfig;
    return doc.data();
  }

  /**
   * Update Neural configuration
   */
  async updateNeuralConfig(data: any): Promise<void> {
    await this.collection.doc("neural_config").set({
      ...data,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  }
}

export const shippingRepository = new ShippingRepository();
export const settingsRepository = new SettingsRepository();
