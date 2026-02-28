import { firestore } from "firebase-admin";
import Timestamp = firestore.Timestamp;
import { ProductVariantTarget } from "./Promotion";

export interface Coupon {
  id: string;
  code: string;
  name: string; // Internal name
  description?: string; // User facing description

  // Discount
  discountType: "PERCENTAGE" | "FIXED" | "FREE_SHIPPING";
  discountValue: number;
  maxDiscount?: number; // Cap for percentage

  // Rules
  minOrderAmount?: number;
  minQuantity?: number;
  applicableProducts?: string[]; // Legacy product-level
  applicableProductVariants?: ProductVariantTarget[]; // Variant-level targeting
  applicableCategories?: string[];
  excludedProducts?: string[];

  // Limits
  usageLimit?: number; // Total global uses
  usageCount: number;
  perUserLimit?: number;

  // Validity
  startDate: Timestamp | string;
  endDate: Timestamp | string; // Optional for never expire?

  isActive: boolean;

  // User Restrictions
  restrictedToUsers?: string[]; // Specific user IDs
  firstOrderOnly?: boolean;

  createdAt: Timestamp | string;
  updatedAt: Timestamp | string;

  // Soft delete
  isDeleted?: boolean;
}

export interface CouponUsage {
  id: string;
  couponId: string;
  userId: string;
  orderId: string;
  discountApplied: number;
  usedAt: Timestamp | string;
}
