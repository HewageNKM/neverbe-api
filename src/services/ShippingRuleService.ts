import { shippingRepository } from "@/repositories/SettingsRepositories";
import { ShippingRule } from "@/model/ShippingRule";
import { AppError } from "@/utils/apiResponse";
import { nanoid } from "nanoid";

/**
 * ShippingRuleService - Business logic for shipping rules
 * Delegates data access to shippingRepository
 */

export const getShippingRules = async () => {
  const rules = await shippingRepository.findAll();
  return rules.map((r) => ({
    ...r,
    createdAt: (r.createdAt as any)?.toDate?.() || r.createdAt,
    updatedAt: (r.updatedAt as any)?.toDate?.() || r.updatedAt,
  }));
};

export const createShippingRule = async (data: Partial<ShippingRule>) => {
  const id = `sr-${nanoid(8)}`;
  await shippingRepository.create(id, data);
  return id;
};

export const updateShippingRule = async (
  id: string,
  data: Partial<ShippingRule>,
) => {
  const exists = await shippingRepository.findById(id);
  if (!exists) throw new AppError(`Shipping rule with ID ${id} not found`, 404);

  const updateData = { ...data };
  delete (updateData as any).id;

  await shippingRepository.update(id, updateData);
  return id;
};

export const deleteShippingRule = async (id: string) => {
  const exists = await shippingRepository.findById(id);
  if (!exists) throw new AppError(`Shipping rule with ID ${id} not found`, 404);
  await shippingRepository.delete(id);
  return id;
};
