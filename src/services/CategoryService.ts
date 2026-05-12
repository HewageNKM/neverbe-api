import { categoryRepository } from "@/repositories/CategoryRepository";
import { Category } from "@/model/Category";
import { nanoid } from "nanoid";
import { AppError } from "@/utils/apiResponse";
import { formatEntityDates, formatListDates } from "./UtilService";

/**
 * CategoryService - Business logic for product categories
 * Delegates data access to categoryRepository
 */

// CREATE
export const createCategory = async (category: Category) => {
  const id = `c-${nanoid(8)}`.toLowerCase();
  const savedCategory = await categoryRepository.create(id, {
    ...category,
    active: category.active ?? true,
  });
  return formatEntityDates(savedCategory);
};

export const getCategories = async (options: {
  page?: number;
  size?: number;
  search?: string;
  status?: "active" | "inactive" | null;
}) => {
  const { dataList, total } = await categoryRepository.findPaginated(options);
  return {
    dataList: formatListDates(dataList),
    rowCount: total,
  };
};

// READ single
export const getCategoryById = async (id: string) => {
  const category = await categoryRepository.findById(id);
  if (!category) throw new AppError("Category not found", 404);
  return formatEntityDates(category);
};

// UPDATE
export const updateCategory = async (id: string, data: Partial<Category>) => {
  const exists = await categoryRepository.findById(id);
  if (!exists) throw new AppError("Category not found", 404);

  return await categoryRepository.update(id, data);
};

// SOFT DELETE
export const softDeleteCategory = async (id: string) => {
  const exists = await categoryRepository.findById(id);
  if (!exists) throw new AppError("Category not found", 404);

  await categoryRepository.softDelete(id);
  return { success: true };
};

// RESTORE
export const restoreCategory = async (id: string) => {
  const exists = await categoryRepository.findById(id);
  if (!exists) throw new AppError("Category not found", 404);

  await categoryRepository.update(id, { isDeleted: false });
  return { success: true };
};

export const getCategoriesForDropdown = async () => {
  return await categoryRepository.findForDropdown();
};

export const getFeaturedCategories = async () => {
  return await categoryRepository.findFeatured();
};
