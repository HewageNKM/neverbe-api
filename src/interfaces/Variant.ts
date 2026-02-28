import { Size } from "./Size";

/**
 * Legacy Variant interface - kept for backwards compatibility
 * For new code, prefer using ProductVariant from ./ProductVariant.ts
 */
export interface Variant {
  variantId: string;
  variantName: string;
  images: [
    {
      file: string;
      url: string;
    }
  ];
  sizes: Size[];
}
