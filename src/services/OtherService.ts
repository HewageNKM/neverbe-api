import { brandRepository } from "@/repositories/BrandRepository";
import { categoryRepository } from "@/repositories/CategoryRepository";
import { settingsRepository } from "@/repositories/SettingsRepositories";
import { websiteRepository } from "@/repositories/WebsiteRepository";

/**
 * OtherService - Business logic for miscellaneous entities
 * Delegates data access to specialized repositories
 */

/**
 * Get active brands for dropdown
 */
export const getBrandsForDropdown = () => brandRepository.findForDropdown();

/**
 * Get full brand objects
 */
export const getBrands = () => brandRepository.findAllActive();

/**
 * Get active categories for dropdown
 */
export const getCategoriesForDropdown = () => categoryRepository.findForDropdown();

/**
 * Get ERP settings
 */
export const getSettings = () => settingsRepository.getErpSettings();

/**
 * Get sliders
 */
export const getSliders = () => websiteRepository.getSliders();

/**
 * Get navigation config
 */
export const getNavigationConfig = () => websiteRepository.getNavigationConfig();
