import { BaseRepository } from "./BaseRepository";
import { ShippingRule } from "@/model/ShippingRule";
import { TaxSettings, DEFAULT_TAX_SETTINGS } from "@/model/TaxSettings";
import { PaymentMethod } from "@/model/PaymentMethod";
import { FieldValue } from "firebase-admin/firestore";

/**
 * Settings Repository - Unified repository for all application settings
 * Handles ERP settings, shipping rules, tax settings, payment methods, and SMS templates
 */
export class SettingsRepository extends BaseRepository<any> {
  constructor() {
    super("app_settings");
  }

  // --- ERP & Ecommerce Settings ---

  /**
   * Get ERP settings with ecommerce mapping
   */
  async getErpSettings(): Promise<any> {
    const doc = await this.collection.doc("erp_settings").get();
    return doc.exists ? doc.data() : null;
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

  // --- Shipping Rules ---

  /**
   * Find all shipping rules
   */
  async findAllShippingRules(): Promise<ShippingRule[]> {
    const snapshot = await this.collection.firestore.collection("shipping_rules").get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ShippingRule));
  }

  /**
   * Find active shipping rules
   */
  async findActiveShippingRules(): Promise<ShippingRule[]> {
    const snapshot = await this.collection.firestore.collection("shipping_rules")
      .where("isActive", "==", true)
      .get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ShippingRule));
  }

  /**
   * Create shipping rule
   */
  async createShippingRule(id: string, data: any): Promise<void> {
    await this.collection.firestore.collection("shipping_rules").doc(id).set({
      ...data,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    });
  }

  /**
   * Update shipping rule
   */
  async updateShippingRule(id: string, data: any): Promise<void> {
    await this.collection.firestore.collection("shipping_rules").doc(id).update({
      ...data,
      updatedAt: FieldValue.serverTimestamp()
    });
  }

  /**
   * Delete shipping rule
   */
  async deleteShippingRule(id: string): Promise<void> {
    await this.collection.firestore.collection("shipping_rules").doc(id).delete();
  }

  /**
   * Find shipping rule by ID
   */
  async findShippingRuleById(id: string): Promise<ShippingRule | null> {
    const doc = await this.collection.firestore.collection("shipping_rules").doc(id).get();
    return doc.exists ? ({ id: doc.id, ...doc.data() } as ShippingRule) : null;
  }

  // --- Tax Settings ---

  /**
   * Get current tax settings
   */
  async getTaxSettings(): Promise<TaxSettings> {
    const doc = await this.collection.firestore.collection("settings").doc("tax").get();
    if (!doc.exists) return DEFAULT_TAX_SETTINGS;
    
    return {
      id: doc.id,
      ...DEFAULT_TAX_SETTINGS,
      ...doc.data(),
    } as TaxSettings;
  }

  /**
   * Update tax settings
   */
  async updateTaxSettings(settings: Partial<TaxSettings>): Promise<void> {
    const updateData = { ...settings, updatedAt: FieldValue.serverTimestamp() };
    delete (updateData as any).id;
    await this.collection.firestore.collection("settings").doc("tax").set(updateData, { merge: true });
  }

  // --- Payment Methods ---

  /**
   * Get all active payment methods
   */
  async findAllActivePaymentMethods(): Promise<PaymentMethod[]> {
    const snapshot = await this.collection.firestore.collection("payment_methods")
      .where("isDeleted", "==", false)
      .get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PaymentMethod));
  }

  /**
   * Find payment method by ID
   */
  async findPaymentMethodById(id: string): Promise<PaymentMethod | null> {
    const doc = await this.collection.firestore.collection("payment_methods").doc(id).get();
    return doc.exists ? ({ id: doc.id, ...doc.data() } as PaymentMethod) : null;
  }

  /**
   * Create payment method
   */
  async createPaymentMethod(id: string, data: any): Promise<void> {
    await this.collection.firestore.collection("payment_methods").doc(id).set({
      ...data,
      isDeleted: false,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    });
  }

  /**
   * Update payment method
   */
  async updatePaymentMethod(id: string, data: any): Promise<void> {
    await this.collection.firestore.collection("payment_methods").doc(id).update({
      ...data,
      updatedAt: FieldValue.serverTimestamp()
    });
  }

  /**
   * Soft delete payment method
   */
  async softDeletePaymentMethod(id: string): Promise<void> {
    await this.collection.firestore.collection("payment_methods").doc(id).update({
      isDeleted: true,
      updatedAt: FieldValue.serverTimestamp()
    });
  }

  /**
   * Get payment methods for Store/POS
   */
  async findPaymentMethodsForStore(): Promise<any[]> {
    const snapshot = await this.collection.firestore.collection("payment_methods")
      .where("isDeleted", "!=", true)
      .where("status", "==", true)
      .where("available", "array-contains", "Store")
      .get();

    return snapshot.docs.map(doc => ({
      paymentId: doc.id,
      ...doc.data(),
      createdAt: (doc.data() as any).createdAt?.toDate?.() || (doc.data() as any).createdAt,
      updatedAt: (doc.data() as any).updatedAt?.toDate?.() || (doc.data() as any).updatedAt,
    }));
  }

  /**
   * Get active payment methods for Website
   */
  async findPaymentMethodsForWebsite(): Promise<any[]> {
    const snapshot = await this.collection.firestore.collection("payment_methods")
      .where("status", "==", true)
      .where("isDeleted", "==", false)
      .where("available", "array-contains", "Website")
      .get();

    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }

  // --- SMS Templates ---

  /**
   * Get SMS template
   */
  async getSmsTemplate(templateId: string): Promise<any | null> {
    const doc = await this.collection.firestore.collection("sms_templates").doc(templateId).get();
    return doc.exists ? doc.data() : null;
  }

  /**
   * Find all SMS templates
   */
  async findAllSmsTemplates(): Promise<any[]> {
    const snapshot = await this.collection.firestore.collection("sms_templates").get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  /**
   * Update SMS template
   */
  async updateSmsTemplate(id: string, data: any): Promise<void> {
    await this.collection.firestore.collection("sms_templates").doc(id).update({
      ...data,
      updatedAt: new Date()
    });
  }

  /**
   * Seed SMS templates
   */
  async seedSmsTemplates(templates: any[]): Promise<void> {
    for (const t of templates) {
      await this.collection.firestore.collection("sms_templates").doc(t.id).set(t);
    }
  }

  // --- Neural Configuration (Legacy but needed) ---

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

export const settingsRepository = new SettingsRepository();
