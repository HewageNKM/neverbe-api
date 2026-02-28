import { Timestamp } from "@firebase/firestore";

export interface PaymentMethod {
  paymentId: string;
  name: string;
  fee: number;
  status: "Active" | "Inactive";
  available: string[];

  createdAt: Timestamp | string;
  updatedAt: Timestamp | string;
}
