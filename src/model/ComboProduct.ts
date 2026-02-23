import { firestore } from "firebase-admin";
import Timestamp = firestore.Timestamp;
import { Img } from "./index";
import { VariantMode } from "./Promotion";

export interface ComboProduct {
  id: string;
  name: string;
  description: string;
  thumbnail?: Img;

  // Bundle items
  items: ComboItem[];

  // Pricing
  originalPrice: number; // Sum of individual prices
  comboPrice: number; // Discounted bundle price
  savings: number; // Auto-calculated

  // Type
  type: "BUNDLE" | "BOGO" | "MULTI_BUY";

  // For BOGO/Multi-buy
  buyQuantity?: number; // Buy X
  getQuantity?: number; // Get Y
  getDiscount?: number; // At Z% off (100 = free)

  status: "ACTIVE" | "INACTIVE";
  startDate?: Timestamp | string;
  endDate?: Timestamp | string;

  createdAt: Timestamp | string;
  updatedAt: Timestamp | string;

  // Soft delete
  isDeleted?: boolean;
}

export interface ComboItem {
  productId: string;
  variantMode: VariantMode; // ALL_VARIANTS or SPECIFIC_VARIANTS
  variantIds?: string[]; // Only used when variantMode is SPECIFIC_VARIANTS
  quantity: number;
  required: boolean; // Must be in cart for combo to apply
}
