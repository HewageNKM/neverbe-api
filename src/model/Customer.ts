import { firestore } from "firebase-admin";
import Timestamp = firestore.Timestamp;

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  zip: string;

  shippingName?: string;
  shippingAddress?: string;
  shippingCity?: string;
  shippingZip?: string;
  shippingPhone?: string;

  createdAt: Timestamp | string;
  updatedAt: Timestamp | string;
}
