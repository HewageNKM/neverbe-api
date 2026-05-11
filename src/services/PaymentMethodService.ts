import { paymentMethodRepository } from "@/repositories/PaymentMethodRepository";
import { PaymentMethod } from "@/model/PaymentMethod";
import { AppError } from "@/utils/apiResponse";
import { nanoid } from "nanoid";

/**
 * PaymentMethodService - Business logic for payment methods
 * Delegates data access to paymentMethodRepository
 */

export const getPaymentMethods = async (): Promise<PaymentMethod[]> => {
  return await paymentMethodRepository.findAllActive();
};

export const getPaymentMethodById = async (id: string): Promise<PaymentMethod> => {
  const method = await paymentMethodRepository.findById(id);
  if (!method || method.isDeleted) {
    throw new AppError(`Payment Method with ID ${id} not found`, 404);
  }
  return method;
};

export const createPaymentMethod = async (
  data: Omit<PaymentMethod, "id" | "createdAt" | "updatedAt" | "isDeleted">,
): Promise<PaymentMethod> => {
  const id = `pm-${nanoid(8)}`;
  return await paymentMethodRepository.create(id, data);
};

export const updatePaymentMethod = async (
  id: string,
  updates: Partial<PaymentMethod>,
): Promise<void> => {
  const exists = await paymentMethodRepository.findById(id);
  if (!exists) throw new AppError(`Payment Method with ID ${id} not found`, 404);
  await paymentMethodRepository.update(id, updates);
};

export const deletePaymentMethod = async (id: string): Promise<void> => {
  const exists = await paymentMethodRepository.findById(id);
  if (!exists) throw new AppError(`Payment Method with ID ${id} not found`, 404);
  await paymentMethodRepository.softDelete(id);
};
