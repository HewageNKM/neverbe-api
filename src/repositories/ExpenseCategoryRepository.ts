import { BaseRepository } from "./BaseRepository";
import { ExpenseCategory } from "@/model/ExpenseCategory";
import { FieldValue } from "firebase-admin/firestore";

/**
 * ExpenseCategory Repository - handles expense category data access
 */
export class ExpenseCategoryRepository extends BaseRepository<ExpenseCategory> {
  constructor() {
    super("expense_categories");
  }

  /**
   * Find all by type
   */
  async findByType(type?: "expense" | "income"): Promise<ExpenseCategory[]> {
    let query = this.getActiveQuery();
    if (type) {
      query = query.where("type", "==", type);
    }
    const snapshot = await query.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ExpenseCategory));
  }

  /**
   * Create category
   */
  async create(id: string, data: Omit<ExpenseCategory, "id">): Promise<ExpenseCategory> {
    const now = FieldValue.serverTimestamp();
    const newCategory = {
      ...data,
      id,
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    };
    await this.collection.doc(id).set(newCategory);
    return newCategory as unknown as ExpenseCategory;
  }

  /**
   * Update category
   */
  async update(id: string, data: Partial<ExpenseCategory>): Promise<ExpenseCategory> {
    const updateData = { ...data };
    delete (updateData as any).id;
    delete (updateData as any).createdAt;

    await this.collection.doc(id).update({
      ...updateData,
      updatedAt: FieldValue.serverTimestamp(),
    });

    const updated = await this.findById(id);
    return updated!;
  }

  /**
   * Get for dropdown
   */
  async findForDropdown(type?: "expense" | "income"): Promise<{ id: string; label: string }[]> {
    let query = this.getActiveQuery().where("status", "==", true);
    if (type) query = query.where("type", "==", type);

    const snapshot = await query.get();
    return snapshot.docs
      .map(doc => ({ id: doc.id, label: doc.data().name as string }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }
}

export const expenseCategoryRepository = new ExpenseCategoryRepository();
