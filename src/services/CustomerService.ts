import { userRepository } from "@/repositories/UserRepository";
import { encryptData, decryptData } from "@/services/EncryptionService";

/**
 * CustomerService - Business logic for customers and users
 * Delegates data access to specialized repositories
 */

interface AddressData {
  type: "Shipping" | "Billing";
  address: string;
  city: string;
  phone: string;
  isDefault?: boolean;
}

export const getUserAddresses = async (uid: string) =>
  userRepository.getUserAddresses(uid, decryptData);

export const saveUserAddress = async (uid: string, data: AddressData) =>
  userRepository.saveUserAddress(uid, data.type, data, encryptData);
