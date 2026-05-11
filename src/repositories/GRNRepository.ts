import { BaseRepository } from "./BaseRepository";
import { GRN } from "@/model/GRN";

/**
 * GRN Repository - handles Good Received Note data access
 */
export class GRNRepository extends BaseRepository<GRN> {
  constructor() {
    super("grn");
  }

  /**
   * Find paginated and filtered GRNs
   */
  async findPaginated(options: {
    purchaseOrderId?: string;
    status?: string;
    supplierId?: string;
    page?: number;
    size?: number;
  }): Promise<{ dataList: GRN[]; total: number }> {
    const { purchaseOrderId, status, supplierId, page = 1, size = 20 } = options;
    let query = this.collection as FirebaseFirestore.Query;

    if (purchaseOrderId) query = query.where("purchaseOrderId", "==", purchaseOrderId);
    if (status) query = query.where("status", "==", status);
    if (supplierId) query = query.where("supplierId", "==", supplierId);

    const total = (await query.count().get()).data().count;
    const snapshot = await query
      .orderBy("createdAt", "desc")
      .offset((page - 1) * size)
      .limit(size)
      .get();

    return {
      dataList: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GRN)),
      total
    };
  }

  /**
   * Get last GRN number for a prefix
   */
  async findLastGRNNumber(prefix: string): Promise<string | null> {
    return this.findLastNumber("grnNumber", prefix);
  }
}

export const grnRepository = new GRNRepository();
