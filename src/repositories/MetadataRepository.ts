import { BaseRepository } from "./BaseRepository";
import dayjs from "../utils/dayjs";

/**
 * Metadata Repository - handles synchronization and system metadata
 */
export class MetadataRepository extends BaseRepository<any> {
  constructor() {
    super("sync_metadata");
  }

  /**
   * Get sync metadata for a specific key
   */
  async getSyncMetadata(key: string): Promise<any | null> {
    return await this.findById(key);
  }

  /**
   * Update sync metadata for a specific key
   */
  async updateSyncMetadata(key: string, data: any): Promise<void> {
    await this.update(key, {
      ...data,
      updatedAt: dayjs().toISOString(),
    } as any);
  }
}

export const metadataRepository = new MetadataRepository();
