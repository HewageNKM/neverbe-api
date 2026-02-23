import { firestore } from "firebase-admin";
import Timestamp = firestore.Timestamp;

/**
 * Variant targeting mode for product-level campaign restrictions
 */
export type VariantMode = "ALL_VARIANTS" | "SPECIFIC_VARIANTS";

/**
 * Product-variant targeting for campaigns
 */
export interface ProductVariantTarget {
  productId: string;
  variantMode: VariantMode;
  variantIds?: string[]; // Only used when variantMode is SPECIFIC_VARIANTS
}

export interface Promotion {
  id: string;
  name: string;
  description: string;
  type: "COMBO" | "BOGO" | "PERCENTAGE" | "FIXED" | "FREE_SHIPPING";
  status: "ACTIVE" | "INACTIVE" | "SCHEDULED";

  // Timing
  startDate: Timestamp | string;
  endDate: Timestamp | string;

  // Banner / Display
  bannerUrl?: string; // Marketing banner image
  bannerTitle?: string; // Marketing headline
  bannerDescription?: string; // Marketing subtext

  // Rules
  conditions: PromotionCondition[];
  actions: PromotionAction[];

  // Limits
  usageLimit?: number; // Total uses allowed
  usageCount: number; // Current usage
  perUserLimit?: number; // Uses per customer

  // Targeting
  applicableProducts?: string[]; // Product IDs (legacy)
  applicableProductVariants?: ProductVariantTarget[]; // Variant-level targeting
  applicableCategories?: string[]; // Category names
  applicableBrands?: string[]; // Brand names
  excludedProducts?: string[];

  // Stacking
  stackable: boolean;
  priority: number;

  createdAt: Timestamp | string;
  updatedAt: Timestamp | string;

  // Status flags
  isActive?: boolean;
  // Soft delete
  isDeleted?: boolean;
}

export interface PromotionCondition {
  type:
    | "MIN_QUANTITY"
    | "MIN_AMOUNT"
    | "SPECIFIC_PRODUCT"
    | "CATEGORY"
    | "CUSTOMER_TAG";
  value: string | number;
  productIds?: string[];
  // Variant-level restriction for SPECIFIC_PRODUCT condition
  variantMode?: VariantMode;
  variantIds?: string[]; // Only used when variantMode is SPECIFIC_VARIANTS
}

export interface PromotionAction {
  type: "PERCENTAGE_OFF" | "FIXED_OFF" | "FREE_ITEM" | "FREE_SHIPPING" | "BOGO";
  value: number; // Discount value
  freeProductId?: string; // For free item promotions
  maxDiscount?: number; // Cap for percentage discounts
}
