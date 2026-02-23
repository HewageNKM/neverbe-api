import { Timestamp } from "firebase-admin/firestore";

export interface PaymentMethod {
  id: string;
  paymentId: string;
  name: string;
  description: string;
  fee: number;
  status: boolean;
  isDeleted?: boolean;
  available: string[];

  createdAt: Timestamp | string;
  updatedAt: Timestamp | string;
}
