import { firestore } from "firebase-admin";
import Timestamp = firestore.Timestamp;

export interface TaxSettings {
  id?: string;
  // Tax Configuration
  taxEnabled: boolean;
  taxName: string; // e.g., "VAT", "GST", "Sales Tax"
  taxRate: number; // percentage (e.g., 15 for 15%)

  // Tax Application Rules
  taxIncludedInPrice: boolean; // true = prices include tax, false = tax added on top
  applyToShipping: boolean;

  // Tax Registration
  taxRegistrationNumber?: string;
  businessName?: string;

  // Thresholds
  minimumOrderForTax?: number; // Only apply tax above this amount

  // Timestamps
  createdAt?: Timestamp | string;
  updatedAt?: Timestamp | string;
}

export const DEFAULT_TAX_SETTINGS: TaxSettings = {
  taxEnabled: false,
  taxName: "VAT",
  taxRate: 0,
  taxIncludedInPrice: true,
  applyToShipping: false,
  taxRegistrationNumber: "",
  businessName: "",
  minimumOrderForTax: 0,
};
