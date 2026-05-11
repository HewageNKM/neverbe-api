import { taxRepository } from "@/repositories/TaxRepository";
import { TaxSettings } from "@/model/TaxSettings";

/**
 * TaxService - Business logic for tax calculations
 * Delegates data access to taxRepository
 */

export const getTaxSettings = async (): Promise<TaxSettings> => {
  return await taxRepository.getSettings();
};

export const updateTaxSettings = async (
  settings: Partial<TaxSettings>
): Promise<TaxSettings> => {
  await taxRepository.updateSettings(settings);
  return await getTaxSettings();
};

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

  if (settings.minimumOrderForTax && orderTotal < settings.minimumOrderForTax) {
    return {
      taxableAmount: 0,
      taxAmount: 0,
      taxRate: settings.taxRate,
      taxName: settings.taxName,
    };
  }

  let taxableAmount = orderTotal;
  if (settings.applyToShipping) taxableAmount += shippingFee;

  let taxAmount: number;
  if (settings.taxIncludedInPrice) {
    taxAmount = taxableAmount - taxableAmount / (1 + settings.taxRate / 100);
  } else {
    taxAmount = (taxableAmount * settings.taxRate) / 100;
  }

  return {
    taxableAmount,
    taxAmount: Math.round(taxAmount * 100) / 100,
    taxRate: settings.taxRate,
    taxName: settings.taxName,
  };
};
