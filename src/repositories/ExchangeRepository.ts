import { BaseRepository } from "./BaseRepository";
import { ExchangeRecord } from "@/model/ExchangeRecord";
import { Filter } from "firebase-admin/firestore";

/**
 * Exchange Repository - handles exchange record data access
 */
export class ExchangeRepository extends BaseRepository<ExchangeRecord> {
  constructor() {
    super("exchanges");
  }

  /**
   * Find exchanges by order ID or doc ID
   */
  async findByOrderId(orderId: string): Promise<ExchangeRecord[]> {
    const cleanId = orderId?.trim();
    if (!cleanId) return [];

    const snapshot = await this.collection
      .where(
        Filter.or(
          Filter.where("originalOrderId", "==", cleanId),
          Filter.where("originalOrderDocId", "==", cleanId),
        ),
      )
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as ExchangeRecord));
  }

  /**
   * Find recent exchanges
   */
  async findRecent(options: {
    stockId?: string;
    limit?: number;
  }): Promise<ExchangeRecord[]> {
    const { stockId, limit = 50 } = options;
    let query = this.collection as FirebaseFirestore.Query;

    if (stockId) {
      query = query.where("stockId", "==", stockId);
    }

    const snapshot = await query
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as ExchangeRecord));
  }
}

export const exchangeRepository = new ExchangeRepository();
