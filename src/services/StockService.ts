import { stockRepository } from "@/repositories/FinanceRepositories";
import { Stock } from "@/model/Stock";
import { nanoid } from "nanoid";
import { AppError } from "@/utils/apiResponse";

/**
 * StockService - Business logic for stock locations
 * Delegates data access to stockRepository
 */

export const getStocks = async (
  pageNumber: number = 1,
  size: number = 20,
  search?: string,
  status?: boolean
): Promise<{ dataList: Stock[]; rowCount: number }> => {
  const { dataList, total } = await stockRepository.findPaginated({
    page: pageNumber,
    size,
    status
  });

  const stocks = dataList.map((data) => ({
    id: data.id,
    name: data.name,
    address: data.address,
    status: data.status,
    createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : undefined,
    updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : undefined,
  } as Stock));

  return { dataList: stocks, rowCount: total };
};

export const addStock = async (
  data: Omit<Stock, "id" | "createdAt" | "updatedAt" | "isDeleted">
): Promise<Stock> => {
  const id = `stock-${nanoid(8)}`;
  return await stockRepository.create(id, data);
};

export const updateStock = async (
  id: string,
  data: Partial<Omit<Stock, "id" | "createdAt" | "updatedAt" | "isDeleted">>
): Promise<void> => {
  const exists = await stockRepository.findById(id);
  if (!exists) throw new AppError(`Stock location with ID ${id} not found.`, 404);
  await stockRepository.update(id, data);
};

export const deleteStock = async (id: string): Promise<void> => {
  const exists = await stockRepository.findById(id);
  if (!exists) throw new AppError(`Stock location with ID ${id} not found.`, 404);
  await stockRepository.softDelete(id);
};

export const getStockForDropdown = async () => {
  return await stockRepository.findForDropdown();
};
