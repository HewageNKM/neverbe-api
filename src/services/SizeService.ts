import { sizeRepository } from "@/repositories/SizeRepository";
import { Size } from "@/model/Size";
import { AppError } from "@/utils/apiResponse";
import { formatEntityDates, formatListDates } from "./UtilService";
import { nanoid } from "nanoid";

/**
 * SizeService - Business logic for product sizes
 * Delegates data access to sizeRepository
 */

export const getSizes = async (options: {
  page?: number;
  size?: number;
  search?: string;
  status?: "active" | "inactive" | null;
}) => {
  const { dataList, total } = await sizeRepository.findPaginated(options);
  return { dataList: formatListDates(dataList), rowCount: total };
};

export const createSize = async (data: Size) => {
  const id = `sz-${nanoid(8)}`;
  const savedSize = await sizeRepository.create(id, {
    ...data,
    nameLower: data.name.toLowerCase(),
  });
  return formatEntityDates(savedSize);
};

export const updateSize = async (id: string, data: Partial<Size>) => {
  const exists = await sizeRepository.findById(id);
  if (!exists) throw new AppError(`Size with ID ${id} not found`, 404);

  const updates = { ...data };
  if (data.name) (updates as any).nameLower = data.name.toLowerCase();

  await sizeRepository.update(id, updates);
  return { id, ...exists, ...updates };
};

export const deleteSize = async (id: string) => {
  const exists = await sizeRepository.findById(id);
  if (!exists) throw new AppError(`Size with ID ${id} not found`, 404);
  await sizeRepository.softDelete(id);
  return { id };
};

export const getSizeDropdown = async () => {
  return await sizeRepository.findForDropdown();
};
