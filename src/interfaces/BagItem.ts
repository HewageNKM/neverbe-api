import { BaseItem } from "./BaseItem";

/**
 * BagItem represents an item in the shopping bag/cart
 */
export interface BagItem extends BaseItem {
  discount: number;
  itemType: string;
  maxQuantity: number;
  variantName?: string;

  // Combo-specific properties
  comboId?: string;
  comboName?: string;
  isComboItem?: boolean;
}
