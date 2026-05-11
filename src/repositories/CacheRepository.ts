import { BaseRepository } from "./BaseRepository";
import { Timestamp } from "firebase-admin/firestore";

/**
 * Cache Repository - handles dashboard and session cache data access
 */
export class CacheRepository extends BaseRepository<any> {
  constructor() {
    super("dashboard_cache");
  }

  /**
   * Get cached document
   */
  async findByKey(key: string): Promise<any | null> {
    const doc = await this.collection.doc(key).get();
    return doc.exists ? doc.data() : null;
  }

  /**
   * Set cache document
   */
  async setWithExpiry(key: string, data: any, expiry: Timestamp): Promise<void> {
    await this.collection.doc(key).set({
      data,
      expiry,
      updatedAt: Timestamp.now(),
    });
  }

  /**
   * Delete cache document
   */
  async deleteByKey(key: string): Promise<void> {
    await this.collection.doc(key).delete();
  }
}

export const cacheRepository = new CacheRepository();
