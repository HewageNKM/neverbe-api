import { adminFirestore } from "@/firebase/firebaseAdmin";
import type {
  Query,
  CollectionReference,
  DocumentSnapshot,
} from "firebase-admin/firestore";

/**
 * Base Repository providing common Firestore operations
 * All repositories should extend this class
 */
export abstract class BaseRepository<T> {
  protected collection: CollectionReference;
  protected collectionName: string;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
    this.collection = adminFirestore.collection(collectionName);
  }

  /**
   * Get base query with standard active filters (isDeleted, status)
   */
  protected getActiveQuery(): Query {
    return this.collection
      .where("isDeleted", "==", false)
      .where("status", "==", true);
  }

  /**
   * Get base query without status filter (for entities that use different status handling)
   */
  protected getNonDeletedQuery(): Query {
    return this.collection.where("isDeleted", "==", false);
  }

  /**
   * Count documents matching query without fetching all data
   */
  protected async countDocuments(query: Query): Promise<number> {
    try {
      const countSnapshot = await query.count().get();
      return countSnapshot.data().count;
    } catch (error) {
      console.error(`[${this.collectionName}Repository] Count error:`, error);
      // Fallback to full fetch if count() not available
      const snapshot = await query.get();
      return snapshot.size;
    }
  }

  /**
   * Apply offset-based pagination to query
   * Note: For large datasets, consider cursor-based pagination
   */
  protected applyPagination(
    query: Query,
    page: number = 1,
    size: number = 20
  ): Query {
    const offset = Math.max(0, (page - 1) * size);
    return query.offset(offset).limit(size);
  }

  /**
   * Fetch a single document by ID
   */
  protected async findDocById(id: string): Promise<DocumentSnapshot | null> {
    const doc = await this.collection.doc(id).get();
    return doc.exists ? doc : null;
  }

  /**
   * Batch fetch documents by IDs (handles Firestore 'in' limit of 30)
   */
  protected async findDocsByIds(
    ids: string[],
    idField: string = "id"
  ): Promise<DocumentSnapshot[]> {
    if (!ids.length) return [];

    const results: DocumentSnapshot[] = [];
    const chunks: string[][] = [];

    // Split into chunks of 30 (Firestore 'in' limit)
    for (let i = 0; i < ids.length; i += 30) {
      chunks.push(ids.slice(i, i + 30));
    }

    for (const chunk of chunks) {
      const snapshot = await this.getActiveQuery()
        .where(idField, "in", chunk)
        .get();
      results.push(...snapshot.docs);
    }

    return results;
  }

  /**
   * Serialize Firestore Timestamp to ISO string
   */
  protected serializeTimestamp(val: any): string | null {
    if (!val) return null;
    if (typeof val.toDate === "function") {
      return val.toDate().toISOString();
    }
    if (val instanceof Date) {
      return val.toISOString();
    }
    return val;
  }

  /**
   * Clear timestamps for client response (prevents serialization issues)
   */
  protected clearTimestamps<D extends { createdAt?: any; updatedAt?: any }>(
    data: D
  ): D {
    return {
      ...data,
      createdAt: null,
      updatedAt: null,
    };
  }
}
