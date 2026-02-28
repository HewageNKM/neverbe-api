import { otherRepository } from "@/repositories/OtherRepository";
import { encryptData, decryptData } from "@/services/EncryptionService";

/**
 * CustomerService - Thin wrapper over OtherRepository
 * Delegates data access to repository layer
 */

interface AddressData {
  type: "Shipping" | "Billing";
  address: string;
  city: string;
  phone: string;
  isDefault?: boolean;
}

export const getUserAddresses = async (uid: string) =>
  otherRepository.getUserAddresses(uid, decryptData);

export const saveUserAddress = async (uid: string, data: AddressData) =>
  otherRepository.saveUserAddress(uid, data.type, data, encryptData);
