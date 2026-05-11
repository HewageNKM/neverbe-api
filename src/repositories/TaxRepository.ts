import { BaseRepository } from "./BaseRepository";
import { TaxSettings, DEFAULT_TAX_SETTINGS } from "@/model/TaxSettings";
import { FieldValue } from "firebase-admin/firestore";

/**
 * Tax Repository - handles tax settings
 */
export class TaxRepository extends BaseRepository<TaxSettings> {
  constructor() {
    super("settings");
  }

  /**
   * Get current tax settings
   */
  async getSettings(): Promise<TaxSettings> {
    const doc = await this.collection.doc("tax").get();
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
  async updateSettings(settings: Partial<TaxSettings>): Promise<void> {
    const updateData = { ...settings, updatedAt: FieldValue.serverTimestamp() };
    delete (updateData as any).id;
    await this.collection.doc("tax").set(updateData, { merge: true });
  }
}

export const taxRepository = new TaxRepository();
