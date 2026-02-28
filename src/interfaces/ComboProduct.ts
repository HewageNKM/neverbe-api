import { firestore } from "firebase-admin";
import Timestamp = firestore.Timestamp;
import { Img } from "./Img";
import { VariantMode } from "./Promotion";

export interface ComboProduct {
  id: string;
  name: string;
  description: string;
  thumbnail?: Img;

  // Items in the bundle
  items: ComboItem[];

  // Pricing
  originalPrice: number; // Sum of individual items
  comboPrice: number; // Discounted price
  savings: number; // Calculated savings

  // Settings
  type: "BUNDLE" | "BOGO" | "MULTI_BUY";
  status: "ACTIVE" | "INACTIVE";
  startDate?: Timestamp | string;
  endDate?: Timestamp | string;

  // For BOGO/Multi logic
  buyQuantity?: number;
  getQuantity?: number;
  getDiscount?: number; // % off on the 'get' items

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
  required: boolean; // Is this item mandatory for the bundle?
}
