import { BaseRepository } from "./BaseRepository";
import { BankAccount } from "@/model/BankAccount";
import { FieldValue } from "firebase-admin/firestore";

/**
 * BankAccount Repository - handles bank account data access
 */
export class BankAccountRepository extends BaseRepository<BankAccount> {
  constructor() {
    super("bank_accounts");
  }

  /**
   * Find all bank accounts with status filter
   */
  async findAllWithStatus(status?: boolean): Promise<BankAccount[]> {
    let query = this.getActiveQuery();
    if (typeof status === "boolean") {
      query = query.where("status", "==", status);
    }
    const snapshot = await query.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BankAccount));
  }

  /**
   * Create bank account
   */
  async create(id: string, data: Omit<BankAccount, "id" | "createdAt" | "updatedAt" | "isDeleted">): Promise<BankAccount> {
    const newAccount = {
      ...data,
      currentBalance: data.currentBalance || 0,
      isDeleted: false,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };
    await this.collection.doc(id).set(newAccount);
    return { id, ...data } as unknown as BankAccount;
  }

  /**
   * Update bank account
   */
  async update(id: string, data: Partial<BankAccount>): Promise<BankAccount> {
    const updates = {
      ...data,
      updatedAt: FieldValue.serverTimestamp(),
    };
    delete (updates as any).id;
    delete (updates as any).createdAt;

    await this.collection.doc(id).update(updates);
    const updated = await this.findById(id);
    return updated!;
  }

  /**
   * Update balance
   */
  async updateBalance(id: string, amount: number, type: "add" | "subtract"): Promise<BankAccount> {
    const docRef = this.collection.doc(id);
    const doc = await docRef.get();
    const currentBalance = doc.data()?.currentBalance || 0;
    const newBalance = type === "add" ? currentBalance + amount : currentBalance - amount;

    await docRef.update({
      currentBalance: newBalance,
      updatedAt: FieldValue.serverTimestamp(),
    });

    const updated = await this.findById(id);
    return updated!;
  }

  /**
   * Get for dropdown
   */
  async findForDropdown(): Promise<{ id: string; label: string }[]> {
    const snapshot = await this.getActiveQuery()
      .where("status", "==", true)
      .orderBy("accountName", "asc")
      .get();
      
    return snapshot.docs.map(doc => ({
      id: doc.id,
      label: `${doc.data().accountName} (${doc.data().bankName})`,
    }));
  }

  /**
   * Get total balance across all accounts
   */
  async calculateTotalBalance(): Promise<number> {
    const snapshot = await this.getActiveQuery()
      .where("status", "==", true)
      .get();
      
    return snapshot.docs.reduce((sum, doc) => sum + (doc.data().currentBalance || 0), 0);
  }
}

export const bankAccountRepository = new BankAccountRepository();
