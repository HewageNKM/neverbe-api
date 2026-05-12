import { bankAccountRepository } from "@/repositories/BankAccountRepository";
import { BankAccount } from "@/model/BankAccount";
import { nanoid } from "nanoid";
import { AppError } from "@/utils/apiResponse";
import { formatEntityDates, formatListDates } from "./UtilService";

/**
 * BankAccountService - Business logic for bank accounts
 * Delegates data access to bankAccountRepository
 */

/**
 * Get all bank accounts
 */
export const getBankAccounts = async (
  status?: boolean
): Promise<BankAccount[]> => {
  return formatListDates(await bankAccountRepository.findAllWithStatus(status));
};

/**
 * Get bank account by ID
 */
export const getBankAccountById = async (id: string): Promise<BankAccount> => {
  const account = await bankAccountRepository.findById(id);
  if (!account) throw new AppError(`Bank Account with ID ${id} not found`, 404);
  return formatEntityDates(account);
};

/**
 * Create bank account
 */
export const createBankAccount = async (
  data: Omit<BankAccount, "id" | "createdAt" | "updatedAt" | "isDeleted">
): Promise<BankAccount> => {
  const id = `ba-${nanoid(8)}`;
  const created = await bankAccountRepository.create(id, data);
  return formatEntityDates(created);
};

/**
 * Update bank account
 */
export const updateBankAccount = async (
  id: string,
  data: Partial<BankAccount>
): Promise<BankAccount> => {
  const exists = await bankAccountRepository.findById(id);
  if (!exists) throw new AppError(`Bank Account with ID ${id} not found`, 404);

  const updated = await bankAccountRepository.update(id, data);
  return formatEntityDates(updated);
};

/**
 * Delete bank account (soft delete)
 */
export const deleteBankAccount = async (id: string): Promise<void> => {
  const exists = await bankAccountRepository.findById(id);
  if (!exists) throw new AppError(`Bank Account with ID ${id} not found`, 404);

  await bankAccountRepository.softDelete(id);
};

/**
 * Update bank account balance
 */
export const updateBankAccountBalance = async (
  id: string,
  amount: number,
  type: "add" | "subtract"
): Promise<BankAccount> => {
  const exists = await bankAccountRepository.findById(id);
  if (!exists) throw new AppError("Account not found", 404);

  const updated = await bankAccountRepository.updateBalance(id, amount, type);
  return formatEntityDates(updated);
};

/**
 * Get bank accounts dropdown
 */
export const getBankAccountsDropdown = async () => {
  return await bankAccountRepository.findForDropdown();
};

/**
 * Get total balance across all accounts
 */
export const getTotalBalance = async (): Promise<number> => {
  return await bankAccountRepository.calculateTotalBalance();
};
