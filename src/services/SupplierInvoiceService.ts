import { supplierInvoiceRepository } from "@/repositories/SupplierInvoiceRepository";
import { paymentRecordRepository } from "@/repositories/FinanceRepositories";
import { uploadFile } from "@/services/StorageService";
import { SupplierInvoice } from "@/model/SupplierInvoice";
import { updateBankAccountBalance } from "./BankAccountService";
import { Timestamp } from "firebase-admin/firestore";
import { nanoid } from "nanoid";
import { AppError } from "@/utils/apiResponse";
import { toSafeLocaleString, formatEntityDates, formatListDates, getNowSL, parseToDayjs } from "./UtilService";
import dayjs from "../utils/dayjs";

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
    const start = parseToDayjs(filters.startDate)?.startOf("day");
    const end = parseToDayjs(filters.endDate)?.endOf("day");

    docs = docs.filter((doc) => {
      const d = parseToDayjs(doc.dueDate);
      if (!d) return true;
      if (start && d.isBefore(start)) return false;
      if (end && d.isAfter(end)) return false;
      return true;
    });
  }

  return formatListDates(docs, ["issueDate", "dueDate", "createdAt", "updatedAt"]);
};

export const getSupplierInvoiceById = async (id: string): Promise<SupplierInvoice> => {
  const doc = await supplierInvoiceRepository.findById(id);
  if (!doc) throw new AppError(`Supplier Invoice with ID ${id} not found`, 404);
  return formatEntityDates({
    ...doc,
  } as any, ["issueDate", "dueDate", "createdAt", "updatedAt"]);
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

  if (data.issueDate) newInvoice.issueDate = parseToDayjs(data.issueDate)?.toDate() || null;
  if (data.dueDate) newInvoice.dueDate = parseToDayjs(data.dueDate)?.toDate() || null;

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

  if (data.issueDate) updates.issueDate = parseToDayjs(data.issueDate)?.toDate() || null;
  if (data.dueDate) updates.dueDate = parseToDayjs(data.dueDate)?.toDate() || null;

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

  const now = getNowSL();
  const next7Days = now.add(7, "day").endOf("day");
  const summary = { overdue: 0, due7Days: 0, totalPayable: 0, count: allUnpaid.length };

  allUnpaid.forEach((inv) => {
    summary.totalPayable += inv.balance;
    const due = parseToDayjs(inv.dueDate);
    if (due) {
      if (due.isBefore(now, "day")) summary.overdue += inv.balance;
      else if (due.isBefore(next7Days) || due.isSame(next7Days, "day")) summary.due7Days += inv.balance;
    }
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
    date: getNowSL().toDate(),
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
