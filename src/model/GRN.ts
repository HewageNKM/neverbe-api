import { firestore } from "firebase-admin";
import Timestamp = firestore.Timestamp;

export interface GRNItem {
  productId: string;
  productName: string;
  variantId?: string;
  variantName?: string;
  size: string;
  orderedQuantity: number;
  receivedQuantity: number;
  unitCost: number;
  totalCost: number;
  stockId: string; // Stock location where received
}

export interface GRN {
  id?: string;
  grnNumber: string;
  purchaseOrderId: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  items: GRNItem[];
  totalAmount: number;
  notes?: string;
  receivedBy?: string;
  receivedDate: string;
  inventoryUpdated: boolean; // Flag to track if stock was updated
  createdAt?: Timestamp | string;
  updatedAt?: Timestamp | string;
}
