import { supplierInvoiceRepository } from "@/repositories/SupplierInvoiceRepository";
import { paymentRecordRepository } from "@/repositories/FinanceRepositories";
import { uploadFile } from "@/services/StorageService";
import { SupplierInvoice } from "@/model/SupplierInvoice";
import { updateBankAccountBalance } from "./BankAccountService";
import { Timestamp } from "firebase-admin/firestore";
import { nanoid } from "nanoid";
import { AppError } from "@/utils/apiResponse";

/**
 * SupplierInvoiceService - Business logic for supplier invoices
 * Delegates data access to repositories
 */

export const getSupplierInvoices = async (filters?: {
  supplierId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}): Promise<SupplierInvoice[]> => {
  let docs = await supplierInvoiceRepository.findFiltered({
    supplierId: filters?.supplierId,
    status: filters?.status
  });

  if (filters?.startDate || filters?.endDate) {
    const start = filters?.startDate ? new Date(filters.startDate).getTime() : 0;
    const end = filters?.endDate ? new Date(filters.endDate).getTime() : Infinity;

    docs = docs.filter((doc) => {
      const date = doc.dueDate instanceof Timestamp ? doc.dueDate.toMillis() : new Date(doc.dueDate as string).getTime();
      return date >= start && date <= end;
    });
  }

  return docs;
};

export const getSupplierInvoiceById = async (id: string): Promise<SupplierInvoice> => {
  const doc = await supplierInvoiceRepository.findById(id);
  if (!doc) throw new AppError(`Supplier Invoice with ID ${id} not found`, 404);
  return doc;
};

export const createSupplierInvoice = async (
  data: Partial<SupplierInvoice>,
  file?: File
): Promise<SupplierInvoice> => {
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
    status: amount - paidAmount <= 0 ? "PAID" : paidAmount > 0 ? "PARTIAL" : "PENDING",
    attachment: attachmentUrl,
    isDeleted: false,
  };

  if (data.issueDate) newInvoice.issueDate = Timestamp.fromDate(new Date(data.issueDate as string));
  if (data.dueDate) newInvoice.dueDate = Timestamp.fromDate(new Date(data.dueDate as string));

  return await supplierInvoiceRepository.create(id, newInvoice);
};

export const updateSupplierInvoice = async (
  id: string,
  data: Partial<SupplierInvoice>,
  file?: File
): Promise<SupplierInvoice> => {
  const current = await supplierInvoiceRepository.findById(id);
  if (!current) throw new AppError(`Supplier Invoice with ID ${id} not found`, 404);

  let attachmentUrl = current.attachment;
  if (file) {
    const uploadResult = await uploadFile(file, `invoices/${id}`);
    attachmentUrl = uploadResult.url;
  }

  const updates: any = { ...data };
  if (attachmentUrl) updates.attachment = attachmentUrl;

  if (data.amount !== undefined || data.paidAmount !== undefined) {
    const total = data.amount !== undefined ? Number(data.amount) : current.amount;
    const paid = data.paidAmount !== undefined ? Number(data.paidAmount) : current.paidAmount;
    updates.balance = total - paid;
    updates.status = total - paid <= 0 ? "PAID" : paid > 0 ? "PARTIAL" : "PENDING";
  }

  if (data.issueDate) updates.issueDate = Timestamp.fromDate(new Date(data.issueDate as string));
  if (data.dueDate) updates.dueDate = Timestamp.fromDate(new Date(data.dueDate as string));

  delete (updates as any).id;
  delete (updates as any).createdAt;

  await supplierInvoiceRepository.update(id, updates);
  return await getSupplierInvoiceById(id);
};

export const deleteSupplierInvoice = async (id: string): Promise<void> => {
  const exists = await supplierInvoiceRepository.findById(id);
  if (!exists) throw new AppError(`Supplier Invoice with ID ${id} not found`, 404);
  await supplierInvoiceRepository.softDelete(id);
};

export const getInvoiceAgingSummary = async (): Promise<any> => {
  const pending = await getSupplierInvoices({ status: "PENDING" });
  const partial = await getSupplierInvoices({ status: "PARTIAL" });
  const allUnpaid = [...pending, ...partial];

  const now = Date.now();
  const summary = { overdue: 0, due7Days: 0, totalPayable: 0, count: allUnpaid.length };

  allUnpaid.forEach((inv) => {
    summary.totalPayable += inv.balance;
    const due = inv.dueDate instanceof Timestamp ? inv.dueDate.toMillis() : new Date(inv.dueDate as string).getTime();
    if (due < now) summary.overdue += inv.balance;
    else if (due < now + 7 * 24 * 60 * 60 * 1000) summary.due7Days += inv.balance;
  });

  return summary;
};

export const recordInvoicePayment = async (
  invoiceId: string,
  amount: number,
  bankAccountId?: string,
  notes?: string
): Promise<SupplierInvoice> => {
  const invoice = await supplierInvoiceRepository.findById(invoiceId);
  if (!invoice) throw new AppError(`Supplier Invoice with ID ${invoiceId} not found`, 404);

  const newPaid = (invoice.paidAmount || 0) + amount;
  const newBalance = invoice.amount - newPaid;
  const newStatus = newBalance <= 0 ? "PAID" : "PARTIAL";

  if (newBalance < 0) throw new AppError("Payment amount exceeds balance", 400);

  if (bankAccountId) await updateBankAccountBalance(bankAccountId, amount, "subtract");

  const paymentId = `pay-${nanoid(8)}`;
  const paymentRecord: any = {
    id: paymentId,
    type: "expense",
    amount,
    date: new Date(),
    category: "Supplier Payment",
    description: notes || `Payment for Invoice #${invoice.invoiceNumber}`,
    relatedId: invoiceId,
    relatedCollection: "supplier_invoices",
    bankAccountId: bankAccountId || null,
    paymentMethod: bankAccountId ? "bank_transfer" : "cash",
  };

  await paymentRecordRepository.create(paymentId, paymentRecord);

  await supplierInvoiceRepository.update(invoiceId, {
    paidAmount: newPaid,
    balance: newBalance,
    status: newStatus,
  });

  return await getSupplierInvoiceById(invoiceId);
};
