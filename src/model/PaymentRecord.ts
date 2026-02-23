import { Timestamp } from "firebase-admin/firestore";

export interface PaymentRecord {
  id?: string;
  type: "expense" | "income";
  amount: number;
  date: Timestamp | string;

  category: string; // e.g., "Supplier Payment", "Refund"
  description?: string;

  relatedId?: string; // e.g. Supplier Invoice ID
  relatedCollection?: "supplier_invoices" | "orders";

  bankAccountId?: string;
  bankAccountName?: string;
  paymentMethod: string; // "bank_transfer", "cash", "cheque"

  createdBy?: string;
  createdAt?: Timestamp | string;
}
