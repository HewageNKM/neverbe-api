import { BaseRepository } from "./BaseRepository";
import { Timestamp } from "firebase-admin/firestore";

/**
 * Usage Repository - handles AI/ML usage logs
 */
export class UsageRepository extends BaseRepository<any> {
  constructor() {
    super("ml_usage_logs");
  }

  /**
   * Log usage event
   */
  async log(source: string, durationMs: number, metadata: any): Promise<void> {
    await this.collection.add({
      source,
      durationMs,
      timestamp: Timestamp.now(),
      ...metadata,
    });
  }
}

export const usageRepository = new UsageRepository();
