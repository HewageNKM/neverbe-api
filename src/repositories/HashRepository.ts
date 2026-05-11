import { BaseRepository } from "./BaseRepository";

/**
 * Hash Repository - handles cryptographic integrity ledger
 */
export class HashRepository extends BaseRepository<any> {
  constructor() {
    super("hash_ledger");
  }

  /**
   * Find hash by document ID
   */
  async findByDocId(docId: string): Promise<any | null> {
    const ledgerId = `hash_${docId}`;
    return await this.findById(ledgerId);
  }

  /**
   * Save or update hash for a document
   */
  async saveHash(docId: string, hashValue: string, sourceCollection: string): Promise<void> {
    const ledgerId = `hash_${docId}`;
    await this.collection.doc(ledgerId).set({
      id: ledgerId,
      hashValue,
      sourceCollection,
      sourceDocId: docId,
      updatedAt: new Date(),
    }, { merge: true });
  }
}

export const hashRepository = new HashRepository();
