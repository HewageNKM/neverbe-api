import { BaseRepository } from "./BaseRepository";
import { SupplierInvoice } from "@/model/SupplierInvoice";

/**
 * SupplierInvoice Repository - handles supplier invoice data access
 */
export class SupplierInvoiceRepository extends BaseRepository<SupplierInvoice> {
  constructor() {
    super("supplier_invoices");
  }

  /**
   * Find invoices with filters
   */
  async findFiltered(filters?: {
    supplierId?: string;
    status?: string;
  }): Promise<SupplierInvoice[]> {
    let query = this.getActiveQuery();

    if (filters?.supplierId) {
      query = query.where("supplierId", "==", filters.supplierId);
    }
    if (filters?.status) {
      query = query.where("status", "==", filters.status);
    }

    query = query.orderBy("dueDate", "asc");

    const snapshot = await query.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SupplierInvoice));
  }
}

export const supplierInvoiceRepository = new SupplierInvoiceRepository();
