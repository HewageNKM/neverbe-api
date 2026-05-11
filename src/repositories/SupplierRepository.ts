import { BaseRepository } from "./BaseRepository";
import { Supplier } from "@/model/Supplier";
import { FieldValue } from "firebase-admin/firestore";

/**
 * Supplier Repository - handles supplier data access
 */
export class SupplierRepository extends BaseRepository<Supplier> {
  constructor() {
    super("suppliers");
  }

  /**
   * Find all suppliers with status filter
   */
  async findAllWithStatus(status?: boolean): Promise<Supplier[]> {
    let query = this.getActiveQuery();
    if (status !== undefined) {
      query = query.where("status", "==", status);
    }
    const snapshot = await query.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Supplier));
  }

  /**
   * Create supplier
   */
  async create(id: string, data: Omit<Supplier, "id" | "createdAt" | "updatedAt">): Promise<Supplier> {
    const newSupplier = {
      ...data,
      id,
      status: true,
      isDeleted: false,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };
    await this.collection.doc(id).set(newSupplier);
    return newSupplier as unknown as Supplier;
  }

  /**
   * Update supplier
   */
  async update(id: string, updates: Partial<Supplier>): Promise<Supplier> {
    const updateData = {
      ...updates,
      updatedAt: FieldValue.serverTimestamp(),
    };
    delete (updateData as any).id;
    delete (updateData as any).createdAt;
    
    await this.collection.doc(id).update(updateData);
    const updated = await this.findById(id);
    return updated!;
  }

  /**
   * Get suppliers for dropdown
   */
  async findForDropdown(): Promise<{ id: string; label: string }[]> {
    const snapshot = await this.getActiveQuery()
      .where("status", "==", true)
      .get();
      
    return snapshot.docs.map(doc => ({
      id: doc.id,
      label: doc.data().name,
    }));
  }
}

export const supplierRepository = new SupplierRepository();
