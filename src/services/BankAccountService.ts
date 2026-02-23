import { adminFirestore } from "@/firebase/firebaseAdmin";
import { BankAccount } from "@/model/BankAccount";
import { FieldValue } from "firebase-admin/firestore";
import { nanoid } from "nanoid";
import { AppError } from "@/utils/apiResponse";

const COLLECTION = "bank_accounts";

/**
 * Get all bank accounts
 */
export const getBankAccounts = async (
  status?: boolean
): Promise<BankAccount[]> => {
  try {
    let query: FirebaseFirestore.Query = adminFirestore
      .collection(COLLECTION)
      .where("isDeleted", "==", false);

    if (typeof status === "boolean") {
      query = query.where("status", "==", status);
    }

    const snapshot = await query.get();
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as BankAccount[];
  } catch (error) {
    console.error("[BankAccountService] Error fetching accounts:", error);
    throw error;
  }
};

/**
 * Get bank account by ID
 */
/**
 * Get bank account by ID
 */
export const getBankAccountById = async (id: string): Promise<BankAccount> => {
  try {
    const doc = await adminFirestore.collection(COLLECTION).doc(id).get();
    if (!doc.exists || doc.data()?.isDeleted) {
      throw new AppError(`Bank Account with ID ${id} not found`, 404);
    }
    return { id: doc.id, ...doc.data() } as BankAccount;
  } catch (error) {
    console.error("[BankAccountService] Error fetching account:", error);
    throw error;
  }
};

/**
 * Create bank account
 */
export const createBankAccount = async (
  data: Omit<BankAccount, "id" | "createdAt" | "updatedAt" | "isDeleted">
): Promise<BankAccount> => {
  // ... existing create logic ... (lines 54-76 in original, but I need to include it if I am replacing a block that covers it? No, I can use chunk replacement.)
  // Wait, I should not replace 'createBankAccount' if not changing it.
  // I will target only getBankAccountById and deleteBankAccount separately if possible, or one block if contiguous.
  // They are separated by create and update. I will use multiple chunks.
  try {
    const id = `ba-${nanoid(8)}`;

    await adminFirestore
      .collection(COLLECTION)
      .doc(id)
      .set({
        ...data,
        currentBalance: data.currentBalance || 0,
        isDeleted: false,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

    return { id, ...data };
  } catch (error) {
    console.error("[BankAccountService] Error creating account:", error);
    throw error;
  }
};

/**
 * Update bank account
 */
export const updateBankAccount = async (
  id: string,
  data: Partial<BankAccount>
): Promise<BankAccount> => {
  try {
    const docRef = adminFirestore.collection(COLLECTION).doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      throw new AppError(`Bank Account with ID ${id} not found`, 404);
    }

    const updates = {
      ...data,
      updatedAt: FieldValue.serverTimestamp(),
    };

    // Check if we need to remove read-only fields just in case
    delete (updates as any).id;
    delete (updates as any).createdAt;

    // We do NOT allow updating currentBalance directly through this method usually,
    // but if the user edits the account details they might want to correct the opening balance?
    // For now let's allow updating what is passed.

    await docRef.update(updates);

    return { id, ...docSnap.data(), ...updates } as BankAccount;
  } catch (error) {
    console.error("[BankAccountService] Error updating account:", error);
    throw error;
  }
};

/**
 * Delete bank account (soft delete)
 */
export const deleteBankAccount = async (id: string): Promise<void> => {
  try {
    const docRef = adminFirestore.collection(COLLECTION).doc(id);
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      throw new AppError(`Bank Account with ID ${id} not found`, 404);
    }

    await docRef.update({
      isDeleted: true,
      updatedAt: FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error("[BankAccountService] Error deleting account:", error);
    throw error;
  }
};

/**
 * Update bank account balance
 */
export const updateBankAccountBalance = async (
  id: string,
  amount: number,
  type: "add" | "subtract"
): Promise<BankAccount> => {
  try {
    const docRef = adminFirestore.collection(COLLECTION).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) throw new AppError("Account not found", 404);

    const currentBalance = doc.data()?.currentBalance || 0;
    const newBalance =
      type === "add" ? currentBalance + amount : currentBalance - amount;

    await docRef.update({
      currentBalance: newBalance,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return { id, ...doc.data(), currentBalance: newBalance } as BankAccount;
  } catch (error) {
    console.error("[BankAccountService] Error updating balance:", error);
    throw error;
  }
};

/**
 * Get bank accounts dropdown
 */
export const getBankAccountsDropdown = async (): Promise<
  { id: string; label: string }[]
> => {
  try {
    const snapshot = await adminFirestore
      .collection(COLLECTION)
      .where("isDeleted", "==", false)
      .where("status", "==", true)
      .orderBy("accountName", "asc")
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      label: `${doc.data().accountName} (${doc.data().bankName})`,
    }));
  } catch (error) {
    console.error("[BankAccountService] Error fetching dropdown:", error);
    return [];
  }
};

/**
 * Get total balance across all accounts
 */
export const getTotalBalance = async (): Promise<number> => {
  try {
    const snapshot = await adminFirestore
      .collection(COLLECTION)
      .where("isDeleted", "==", false)
      .where("status", "==", true)
      .get();

    return snapshot.docs.reduce((sum, doc) => {
      return sum + (doc.data().currentBalance || 0);
    }, 0);
  } catch (error) {
    console.error("[BankAccountService] Error calculating total:", error);
    return 0;
  }
};
