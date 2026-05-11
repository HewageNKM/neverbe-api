import { Timestamp } from "@firebase/firestore";
import { Variant } from "./Variant";

/**
 * Legacy Item interface - kept for backwards compatibility
 * For new code, prefer using Product from ./Product.ts
 */
export interface Item {
  itemId: string;
  type: string;
  brand: string;
  description: string;
  keywords: string[];
  thumbnail: {
    file: string;
    url: string;
  };
  variants: Variant[];
  manufacturer: string;
  name: string;
  sellingPrice: number;
  marketPrice: number;
  buyingPrice: number;
  discount: number;
  listing: "Active" | "Inactive";
  status: "Active" | "Inactive";

  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}
