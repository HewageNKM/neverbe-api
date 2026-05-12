import { purchaseOrderRepository } from "@/repositories/PurchaseOrderRepository";
import {
  PurchaseOrder,
  PurchaseOrderStatus,
  PurchaseOrderItem,
} from "@/model/PurchaseOrder";
import { AppError } from "@/utils/apiResponse";
import { nanoid } from "nanoid";
import { formatEntityDates, formatListDates } from "./UtilService";

/**
 * PurchaseOrderService - Business logic for purchase orders
 * Delegates data access to purchaseOrderRepository
 */

const generatePONumber = async (): Promise<string> => {
  const today = new Date();
  const prefix = `PO-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}`;

  const lastPONumber = await purchaseOrderRepository.findLastPONumber(prefix);

  let sequence = 1;
  if (lastPONumber) {
    const lastSeq = parseInt(lastPONumber.split("-").pop() || "0", 10);
    sequence = lastSeq + 1;
  }

  return `${prefix}-${String(sequence).padStart(4, "0")}`;
};

export const getPurchaseOrders = async (
  status?: PurchaseOrderStatus,
  supplierId?: string,
): Promise<PurchaseOrder[]> => {
  const { dataList } = await purchaseOrderRepository.findPaginated({ status, supplierId, size: 1000 });
  return formatListDates(dataList);
};

export const getPurchaseOrderById = async (id: string): Promise<PurchaseOrder> => {
  const po = await purchaseOrderRepository.findById(id);
  if (!po) throw new AppError(`Purchase Order with ID ${id} not found`, 404);
  return formatEntityDates(po);
};

export const createPurchaseOrder = async (
  po: Omit<PurchaseOrder, "id" | "poNumber" | "createdAt" | "updatedAt">,
): Promise<PurchaseOrder> => {
  const poNumber = await generatePONumber();
  const totalAmount = po.items.reduce((sum, item) => sum + item.totalCost, 0);

  const items: PurchaseOrderItem[] = po.items.map((item) => ({
    ...item,
    receivedQuantity: 0,
  }));

  const id = `po-${nanoid(8)}`;
  const newPO: PurchaseOrder = {
    ...po,
    poNumber,
    items,
    totalAmount,
    status: po.status || "DRAFT",
  } as PurchaseOrder;

  return await purchaseOrderRepository.create(id, newPO);
};

export const updatePurchaseOrder = async (
  id: string,
  updates: Partial<PurchaseOrder>,
): Promise<PurchaseOrder> => {
  const exists = await purchaseOrderRepository.findById(id);
  if (!exists) throw new AppError(`Purchase Order with ID ${id} not found`, 404);

  const updateData = { ...updates };
  delete (updateData as any).id;
  delete (updateData as any).poNumber;
  delete (updateData as any).createdAt;

  if (updateData.items) {
    updateData.totalAmount = updateData.items.reduce((sum, item) => sum + item.totalCost, 0);
  }

  await purchaseOrderRepository.update(id, updateData);
  return await getPurchaseOrderById(id);
};

export const updatePOStatus = async (
  id: string,
  status: PurchaseOrderStatus,
): Promise<PurchaseOrder> => {
  return updatePurchaseOrder(id, { status });
};

export const updateReceivedQuantities = async (
  id: string,
  receivedItems: {
    productId: string;
    variantId?: string;
    size: string;
    quantity: number;
  }[],
): Promise<PurchaseOrder> => {
  await purchaseOrderRepository.updateReceivedQuantities(id, receivedItems);
  return await getPurchaseOrderById(id);
};

export const deletePurchaseOrder = async (id: string): Promise<void> => {
  const po = await getPurchaseOrderById(id);
  if (po.status !== "DRAFT") throw new AppError("Only draft POs can be deleted", 400);
  await purchaseOrderRepository.delete(id);
};

export const getPendingPurchaseOrders = async (): Promise<PurchaseOrder[]> => {
  return formatListDates(await purchaseOrderRepository.findPending());
};
