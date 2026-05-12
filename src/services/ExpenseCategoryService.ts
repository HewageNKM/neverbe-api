import { expenseCategoryRepository } from "@/repositories/ExpenseCategoryRepository";
import { ExpenseCategory } from "@/model/ExpenseCategory";
import { nanoid } from "nanoid";
import { AppError } from "@/utils/apiResponse";
import { formatEntityDates, formatListDates } from "./UtilService";

/**
 * ExpenseCategoryService - Business logic for expense categories
 * Delegates data access to expenseCategoryRepository
 */

/**
 * Get category by ID
 */
export const getExpenseCategoryById = async (
  id: string
): Promise<ExpenseCategory> => {
  const category = await expenseCategoryRepository.findById(id);
  if (!category) throw new AppError(`Expense Category with ID ${id} not found`, 404);
  return formatEntityDates(category);
};

/**
 * Create expense category
 */
export const createExpenseCategory = async (
  data: Omit<ExpenseCategory, "id">
): Promise<ExpenseCategory> => {
  const id = `ec-${nanoid(8)}`;
  return await expenseCategoryRepository.create(id, data);
};

/**
 * Get all expense categories
 */
export const getExpenseCategories = async (
  type?: "expense" | "income"
): Promise<ExpenseCategory[]> => {
  return formatListDates(await expenseCategoryRepository.findByType(type));
};

/**
 * Update expense category
 */
export const updateExpenseCategory = async (
  id: string,
  data: Partial<ExpenseCategory>
): Promise<ExpenseCategory> => {
  const exists = await expenseCategoryRepository.findById(id);
  if (!exists) throw new AppError(`Expense Category with ID ${id} not found`, 404);

  return await expenseCategoryRepository.update(id, data);
};

/**
 * Delete expense category (soft delete)
 */
export const deleteExpenseCategory = async (id: string): Promise<void> => {
  const exists = await expenseCategoryRepository.findById(id);
  if (!exists) throw new AppError(`Expense Category with ID ${id} not found`, 404);

  await expenseCategoryRepository.softDelete(id);
};

/**
 * Get categories dropdown
 */
export const getExpenseCategoriesDropdown = async (
  type?: "expense" | "income"
) => {
  return await expenseCategoryRepository.findForDropdown(type);
};
