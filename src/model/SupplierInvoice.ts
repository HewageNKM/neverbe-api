import { Timestamp } from "firebase-admin/firestore";

export interface SupplierInvoice {
  id?: string;
  invoiceNumber: string;
  supplierId: string;
  supplierName: string;
  purchaseOrderId?: string; // Optional link to PO

  issueDate: Timestamp | string;
  dueDate: Timestamp | string;

  amount: number;
  paidAmount: number;
  balance: number;

  currency: string;
  status: "PENDING" | "PARTIAL" | "PAID" | "OVERDUE" | "CANCELLED";

  notes?: string;
  attachment?: string;

  isDeleted?: boolean;
  createdAt?: Timestamp | string;
  updatedAt?: Timestamp | string;
  createdBy?: string;
}
