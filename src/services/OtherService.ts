import { otherRepository } from "@/repositories/OtherRepository";

/**
 * OtherService - Thin wrapper over OtherRepository
 * Delegates all data access to repository layer
 */

/**
 * Get active brands for dropdown
 */
export const getBrandsForDropdown = () =>
  otherRepository.getBrandsForDropdown();

/**
 * Get full brand objects
 */
export const getBrands = () => otherRepository.getBrands();

/**
 * Get active categories for dropdown
 */
export const getCategoriesForDropdown = () =>
  otherRepository.getCategoriesForDropdown();

/**
 * Get ERP settings
 */
export const getSettings = () => otherRepository.getSettings();
