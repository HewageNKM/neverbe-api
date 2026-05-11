import { BaseRepository } from "./BaseRepository";
import { InventoryAdjustment } from "@/model/InventoryAdjustment";

/**
 * InventoryAdjustment Repository - handles stock adjustment data access
 */
export class InventoryAdjustmentRepository extends BaseRepository<InventoryAdjustment> {
  constructor() {
    super("inventory_adjustments");
  }

  /**
   * Find paginated and filtered adjustments
   */
  async findPaginated(options: {
    page?: number;
    size?: number;
    type?: string;
    status?: string;
    search?: string;
  }): Promise<{ dataList: InventoryAdjustment[]; total: number }> {
    const { page = 1, size = 20, type, status, search } = options;
    let query = this.collection as FirebaseFirestore.Query;

    if (type) query = query.where("type", "==", type);
    if (status) query = query.where("status", "==", status);

    if (search) {
      query = query.where("adjustmentNumber", ">=", search).where("adjustmentNumber", "<=", search + "\uf8ff");
    }

    const total = (await query.count().get()).data().count;
    const snapshot = await query
      .orderBy("createdAt", "desc")
      .offset((page - 1) * size)
      .limit(size)
      .get();

    return {
      dataList: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InventoryAdjustment)),
      total
    };
  }

  /**
   * Get last adjustment number for a prefix
   */
  async findLastAdjustmentNumber(prefix: string): Promise<string | null> {
    const snapshot = await this.collection
      .where("adjustmentNumber", ">=", prefix)
      .where("adjustmentNumber", "<", prefix + "\uf8ff")
      .orderBy("adjustmentNumber", "desc")
      .limit(1)
      .get();

    if (snapshot.empty) return null;
    return snapshot.docs[0].data().adjustmentNumber;
  }
}

export const inventoryAdjustmentRepository = new InventoryAdjustmentRepository();
