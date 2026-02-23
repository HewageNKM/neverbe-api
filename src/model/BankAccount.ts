import { Timestamp } from "firebase-admin/firestore";

export interface BankAccount {
  id?: string;
  accountName: string;
  bankName: string;
  accountNumber: string;
  accountType: "checking" | "savings" | "cash";
  currentBalance: number;
  currency: string;
  status: boolean;
  notes?: string;
  isDeleted?: boolean;
  createdAt?: Timestamp | string;
  updatedAt?: Timestamp | string;
}
