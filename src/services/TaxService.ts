import { adminFirestore } from "@/firebase/firebaseAdmin";
import { TaxSettings, DEFAULT_TAX_SETTINGS } from "@/model/TaxSettings";
import { FieldValue } from "firebase-admin/firestore";

const TAX_SETTINGS_COLLECTION = "settings";
const TAX_SETTINGS_DOC_ID = "tax";

/**
 * Get current tax settings
 */
export const getTaxSettings = async (): Promise<TaxSettings> => {
  try {
    const doc = await adminFirestore
      .collection(TAX_SETTINGS_COLLECTION)
      .doc(TAX_SETTINGS_DOC_ID)
      .get();

    if (!doc.exists) {
      // Return defaults if no settings exist
      return DEFAULT_TAX_SETTINGS;
    }

    return {
      id: doc.id,
      ...DEFAULT_TAX_SETTINGS,
      ...doc.data(),
    } as TaxSettings;
  } catch (error) {
    console.error("[TaxService] Error fetching tax settings:", error);
    throw error;
  }
};

/**
 * Update tax settings
 */
export const updateTaxSettings = async (
  settings: Partial<TaxSettings>
): Promise<TaxSettings> => {
  try {
    const docRef = adminFirestore
      .collection(TAX_SETTINGS_COLLECTION)
      .doc(TAX_SETTINGS_DOC_ID);

    const updateData = {
      ...settings,
      updatedAt: FieldValue.serverTimestamp(),
    };

    // Remove id from update data
    delete (updateData as any).id;

    await docRef.set(updateData, { merge: true });

    console.log("[TaxService] Tax settings updated successfully");

    return getTaxSettings();
  } catch (error) {
    console.error("[TaxService] Error updating tax settings:", error);
    throw error;
  }
};

/**
 * Calculate tax amount for a given order total
 */
export const calculateTax = async (
  orderTotal: number,
  shippingFee: number = 0
): Promise<{
  taxableAmount: number;
  taxAmount: number;
  taxRate: number;
  taxName: string;
}> => {
  const settings = await getTaxSettings();

  if (!settings.taxEnabled || settings.taxRate <= 0) {
    return {
      taxableAmount: 0,
      taxAmount: 0,
      taxRate: 0,
      taxName: settings.taxName,
    };
  }

  // Check minimum threshold
  if (settings.minimumOrderForTax && orderTotal < settings.minimumOrderForTax) {
    return {
      taxableAmount: 0,
      taxAmount: 0,
      taxRate: settings.taxRate,
      taxName: settings.taxName,
    };
  }

  // Calculate taxable amount
  let taxableAmount = orderTotal;
  if (settings.applyToShipping) {
    taxableAmount += shippingFee;
  }

  let taxAmount: number;
  if (settings.taxIncludedInPrice) {
    // Extract tax from price (tax already included)
    // Formula: taxAmount = taxableAmount - (taxableAmount / (1 + rate/100))
    taxAmount = taxableAmount - taxableAmount / (1 + settings.taxRate / 100);
  } else {
    // Add tax on top of price
    taxAmount = (taxableAmount * settings.taxRate) / 100;
  }

  return {
    taxableAmount,
    taxAmount: Math.round(taxAmount * 100) / 100,
    taxRate: settings.taxRate,
    taxName: settings.taxName,
  };
};
