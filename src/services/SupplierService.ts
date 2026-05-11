import { supplierRepository } from "@/repositories/SupplierRepository";
import { Supplier } from "@/model/Supplier";
import { nanoid } from "nanoid";
import { AppError } from "@/utils/apiResponse";

/**
 * SupplierService - Business logic for product suppliers
 * Delegates data access to supplierRepository
 */

/**
 * Get all suppliers
 */
export const getSuppliers = async (
  status?: boolean | "active" | "inactive",
  search?: string,
): Promise<Supplier[]> => {
  const statusBool = status === undefined ? undefined : (typeof status === "boolean" ? status : status === "active");
  let suppliers = await supplierRepository.findAllWithStatus(statusBool);

  if (search) {
    const lowSearch = search.toLowerCase();
    suppliers = suppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(lowSearch) ||
        s.email?.toLowerCase().includes(lowSearch) ||
        s.phone?.includes(search) ||
        s.contactPerson?.toLowerCase().includes(lowSearch),
    );
  }

  return suppliers;
};

/**
 * Get supplier by ID
 */
export const getSupplierById = async (id: string): Promise<Supplier> => {
  const supplier = await supplierRepository.findById(id);
  if (!supplier) throw new AppError("Supplier not found", 404);
  return supplier;
};

/**
 * Create supplier
 */
export const createSupplier = async (
  data: Omit<Supplier, "id" | "createdAt" | "updatedAt">,
): Promise<Supplier> => {
  const id = `sup-${nanoid(8)}`;
  return await supplierRepository.create(id, data);
};

/**
 * Update supplier
 */
export const updateSupplier = async (
  id: string,
  updates: Partial<Supplier>,
): Promise<Supplier> => {
  const exists = await supplierRepository.findById(id);
  if (!exists) throw new AppError("Supplier not found", 404);

  return await supplierRepository.update(id, updates);
};

/**
 * Delete supplier
 */
export const deleteSupplier = async (id: string): Promise<void> => {
  const exists = await supplierRepository.findById(id);
  if (!exists) throw new AppError("Supplier not found", 404);

  await supplierRepository.softDelete(id);
};

/**
 * Get suppliers dropdown list
 */
export const getSuppliersDropdown = async () => {
  return await supplierRepository.findForDropdown();
};
