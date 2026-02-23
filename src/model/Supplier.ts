import { firestore } from "firebase-admin";
import Timestamp = firestore.Timestamp;

export interface Supplier {
  id?: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  paymentTerms?: string; // e.g., "Net 30", "COD", "Advance"
  notes?: string;
  status: boolean;
  createdAt?: Timestamp | string;
  updatedAt?: Timestamp | string;
  isDeleted?: boolean;
}

export const DEFAULT_SUPPLIER: Partial<Supplier> = {
  name: "",
  contactPerson: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  paymentTerms: "COD",
  notes: "",
  status: true,
};
