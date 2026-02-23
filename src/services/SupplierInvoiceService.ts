import { adminFirestore } from "@/firebase/firebaseAdmin";
import { uploadFile } from "@/services/StorageService";
import { SupplierInvoice } from "@/model/SupplierInvoice";
import { updateBankAccountBalance } from "./BankAccountService";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { nanoid } from "nanoid";
import { AppError } from "@/utils/apiResponse";

const COLLECTION = "supplier_invoices";

// ... existing getSupplierInvoices remains same ...

// Note: I will just replace from getSupplierInvoiceById downwards because getSupplierInvoices is long and unchanged.
// Wait, I need import AppError, so I need header too.
// I will split into 2 replacements if possible, but replace_file_content supports single replacement.
// I will replace the whole file content in sections or just the changed parts.
// Let's replace the whole file to be safe and cleanest.

/**
 * Get invoices with filtering
 */
export const getSupplierInvoices = async (filters?: {
  supplierId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}): Promise<SupplierInvoice[]> => {
  try {
    let query: FirebaseFirestore.Query = adminFirestore
      .collection(COLLECTION)
      .where("isDeleted", "==", false);

    if (filters?.supplierId) {
      query = query.where("supplierId", "==", filters.supplierId);
    }
    if (filters?.status) {
      query = query.where("status", "==", filters.status);
    }

    // Date filtering would ideally use composite indexes, keeping it simple for now
    // or apply in memory if volume is low. For scalability, add index.

    query = query.orderBy("dueDate", "asc");

    const snapshot = await query.get();
    let docs = snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as SupplierInvoice)
    );

    // Manual date filtering if needed
    if (filters?.startDate || filters?.endDate) {
      const start = filters?.startDate
        ? new Date(filters.startDate).getTime()
        : 0;
      const end = filters?.endDate
        ? new Date(filters.endDate).getTime()
        : Infinity;

      docs = docs.filter((doc) => {
        const date =
          doc.dueDate instanceof Timestamp
            ? doc.dueDate.toMillis()
            : new Date(doc.dueDate as string).getTime();
        return date >= start && date <= end;
      });
    }

    return docs;
  } catch (error) {
    console.error("[SupplierInvoiceService] Error fetching invoices:", error);
    throw error;
  }
};

/**
 * Get single invoice
 */
export const getSupplierInvoiceById = async (
  id: string
): Promise<SupplierInvoice> => {
  try {
    const doc = await adminFirestore.collection(COLLECTION).doc(id).get();
    if (!doc.exists || doc.data()?.isDeleted) {
      throw new AppError(`Supplier Invoice with ID ${id} not found`, 404);
    }
    return { id: doc.id, ...doc.data() } as SupplierInvoice;
  } catch (error) {
    console.error("[SupplierInvoiceService] Error fetching invoice:", error);
    throw error;
  }
};

/**
 * Create invoice
 */
export const createSupplierInvoice = async (
  data: Partial<SupplierInvoice>,
  file?: File
): Promise<SupplierInvoice> => {
  try {
    const id = `inv-${nanoid(8)}`;
    let attachmentUrl = "";

    if (file) {
      const uploadResult = await uploadFile(file, `invoices/${id}`);
      attachmentUrl = uploadResult.url;
    }

    const amount = Number(data.amount) || 0;
    const paidAmount = Number(data.paidAmount) || 0;

    const newInvoice: any = {
      ...data,
      id,
      amount,
      paidAmount,
      balance: amount - paidAmount,
      status:
        amount - paidAmount <= 0
          ? "PAID"
          : paidAmount > 0
          ? "PARTIAL"
          : "PENDING",
      attachment: attachmentUrl,
      isDeleted: false,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    // Ensure dates are Timestamps
    if (data.issueDate)
      newInvoice.issueDate = Timestamp.fromDate(
        new Date(data.issueDate as string)
      );
    if (data.dueDate)
      newInvoice.dueDate = Timestamp.fromDate(new Date(data.dueDate as string));

    await adminFirestore.collection(COLLECTION).doc(id).set(newInvoice);
    return newInvoice;
  } catch (error) {
    console.error("[SupplierInvoiceService] Error creating invoice:", error);
    throw error;
  }
};

/**
 * Update invoice
 */
export const updateSupplierInvoice = async (
  id: string,
  data: Partial<SupplierInvoice>,
  file?: File
): Promise<SupplierInvoice> => {
  try {
    const docRef = adminFirestore.collection(COLLECTION).doc(id);
    const doc = await docRef.get();

    if (!doc.exists)
      throw new AppError(`Supplier Invoice with ID ${id} not found`, 404);

    let attachmentUrl = doc.data()?.attachment;
    if (file) {
      const uploadResult = await uploadFile(file, `invoices/${id}`);
      attachmentUrl = uploadResult.url;
    }

    const updates: any = { ...data, updatedAt: FieldValue.serverTimestamp() };
    if (attachmentUrl) updates.attachment = attachmentUrl;

    // Recalculate balance/status if amount changed
    if (data.amount !== undefined || data.paidAmount !== undefined) {
      const current = doc.data() as SupplierInvoice;
      const total =
        data.amount !== undefined ? Number(data.amount) : current.amount;
      const paid =
        data.paidAmount !== undefined
          ? Number(data.paidAmount)
          : current.paidAmount;

      updates.balance = total - paid;
      updates.status =
        total - paid <= 0 ? "PAID" : paid > 0 ? "PARTIAL" : "PENDING";
    }

    if (data.issueDate)
      updates.issueDate = Timestamp.fromDate(
        new Date(data.issueDate as string)
      );
    if (data.dueDate)
      updates.dueDate = Timestamp.fromDate(new Date(data.dueDate as string));

    delete updates.id;
    delete updates.createdAt;

    await docRef.update(updates);
    return { id, ...doc.data(), ...updates } as SupplierInvoice;
  } catch (error) {
    console.error("[SupplierInvoiceService] Error updating invoice:", error);
    throw error;
  }
};

/**
 * Delete invoice (soft)
 */
export const deleteSupplierInvoice = async (id: string): Promise<void> => {
  try {
    const docRef = adminFirestore.collection(COLLECTION).doc(id);
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      throw new AppError(`Supplier Invoice with ID ${id} not found`, 404);
    }

    await docRef.update({
      isDeleted: true,
      updatedAt: FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error("[SupplierInvoiceService] Error deleting invoice:", error);
    throw error;
  }
};

/**
 * Get aging summary (Overdue, Due Soon, etc.)
 */
export const getInvoiceAgingSummary = async (): Promise<any> => {
  try {
    const invoices = await getSupplierInvoices({ status: "PENDING" }); // Get all pending/partial
    // Also get PARTIAL
    const partial = await getSupplierInvoices({ status: "PARTIAL" });
    const allUnpaid = [...invoices, ...partial];

    const now = Date.now();
    const summary = {
      overdue: 0,
      due7Days: 0,
      totalPayable: 0,
      count: allUnpaid.length,
    };

    allUnpaid.forEach((inv) => {
      summary.totalPayable += inv.balance;
      const due =
        inv.dueDate instanceof Timestamp
          ? inv.dueDate.toMillis()
          : new Date(inv.dueDate as string).getTime();

      if (due < now) {
        summary.overdue += inv.balance;
      } else if (due < now + 7 * 24 * 60 * 60 * 1000) {
        summary.due7Days += inv.balance;
      }
    });

    return summary;
  } catch (error) {
    return {};
  }
};

/**
 * Record payment for invoice and update bank balance
 */
export const recordInvoicePayment = async (
  invoiceId: string,
  amount: number,
  bankAccountId?: string,
  notes?: string
): Promise<SupplierInvoice> => {
  try {
    const docRef = adminFirestore.collection(COLLECTION).doc(invoiceId);
    const doc = await docRef.get();
    if (!doc.exists)
      throw new AppError(
        `Supplier Invoice with ID ${invoiceId} not found`,
        404
      );

    const invoice = doc.data() as SupplierInvoice;
    const newPaid = (invoice.paidAmount || 0) + amount;
    const newBalance = invoice.amount - newPaid;
    const newStatus = newBalance <= 0 ? "PAID" : "PARTIAL";

    if (newBalance < 0)
      throw new AppError("Payment amount exceeds balance", 400);

    // Update Bank Balance if account provided
    if (bankAccountId) {
      await updateBankAccountBalance(bankAccountId, amount, "subtract");
    }

    // Create Payment Record
    const paymentId = `pay-${nanoid(8)}`;
    const paymentRecord: any = {
      id: paymentId,
      type: "expense",
      amount,
      date: FieldValue.serverTimestamp(),
      category: "Supplier Payment",
      description: notes || `Payment for Invoice #${invoice.invoiceNumber}`,
      relatedId: invoiceId,
      relatedCollection: "supplier_invoices",
      bankAccountId: bankAccountId || null,
      paymentMethod: bankAccountId ? "bank_transfer" : "cash",
      createdAt: FieldValue.serverTimestamp(),
    };

    await adminFirestore
      .collection("payment_records")
      .doc(paymentId)
      .set(paymentRecord);

    const updates = {
      paidAmount: newPaid,
      balance: newBalance,
      status: newStatus,
      updatedAt: FieldValue.serverTimestamp(),
    };

    await docRef.update(updates);

    return { ...invoice, ...updates, id: invoiceId } as SupplierInvoice;
  } catch (error) {
    console.error("[SupplierInvoiceService] Error recording payment:", error);
    throw error;
  }
};
