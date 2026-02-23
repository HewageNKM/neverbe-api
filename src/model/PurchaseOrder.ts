import { firestore } from "firebase-admin";
import Timestamp = firestore.Timestamp;

export type PurchaseOrderStatus =
  | "draft"
  | "sent"
  | "partial"
  | "received"
  | "cancelled";

export interface PurchaseOrderItem {
  productId: string;
  productName: string;
  variantId?: string;
  variantName?: string;
  size: string;
  quantity: number;
  receivedQuantity?: number; // Updated when GRN is created
  unitCost: number;
  totalCost: number;
}

export interface PurchaseOrder {
  id?: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  items: PurchaseOrderItem[];
  status: PurchaseOrderStatus;
  totalAmount: number;
  notes?: string;
  expectedDate?: string;
  stockId?: string; // Target stock location for receiving
  createdBy?: string;
  createdAt?: Timestamp | string;
  updatedAt?: Timestamp | string;
}

export const PO_STATUS_LABELS: Record<PurchaseOrderStatus, string> = {
  draft: "Draft",
  sent: "Sent to Supplier",
  partial: "Partially Received",
  received: "Fully Received",
  cancelled: "Cancelled",
};

export const PO_STATUS_COLORS: Record<PurchaseOrderStatus, string> = {
  draft: "bg-gray-100 text-gray-800",
  sent: "bg-blue-100 text-blue-800",
  partial: "bg-yellow-100 text-yellow-800",
  received: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};
